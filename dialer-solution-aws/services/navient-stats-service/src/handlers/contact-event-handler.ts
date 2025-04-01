import { DispositionType } from 'navient-common/lib/models/outbound-contact-info';
import { HistoricalStatsSettableKey } from 'navient-common/lib/types/stats/historical-stats';
import { ContactInfoDb } from 'navient-services-common/lib/db/contact-info-db';
import { PacingStatsDb } from 'navient-services-common/lib/db/pacing-stats-db';
import { RedisClientPool } from 'navient-services-common/lib/db/redis-client-pool';
import { Logger } from 'navient-services-common/lib/logger/logger';
import { ContactEvent, ContactEventType } from 'navient-services-common/lib/types/amazon-connect/contact-event';
import { DbInstanceManager } from 'navient-services-common/lib/utils/db-instance-manager';
import { WorkBatcher } from 'navient-services-common/lib/utils/work-batcher';
import { ContactDispositionHandler } from '../contact-disposition-handler';
import { ChainableCommander } from 'ioredis';

type HistoricalStatContactEventData = {
  contactEvent: ContactEvent;
  historicalStatsTypes: HistoricalStatsSettableKey[];
};

const eventStatUpdateTriggers: ContactEventType[] = ['INITIATED', 'CONNECTED_TO_AGENT', 'QUEUED', 'DISCONNECTED'];

const contactInfoUpdateTriggers: ContactEventType[] = ['INITIATED', 'CONNECTED_TO_SYSTEM', 'DISCONNECTED'];

export class ContactEventHandler {
  protected readonly logger: Logger = Logger.getLogger();
  contactWorkBatcher: WorkBatcher<ContactEvent, string>;
  redisClientPool: RedisClientPool;
  contactInfoDb: ContactInfoDb;
  statsDb: PacingStatsDb;
  contactDispositionHandler: ContactDispositionHandler;

  constructor() {
    const dbInstanceManager = DbInstanceManager.getInstance();
    this.redisClientPool = dbInstanceManager.getRedisClientPool();
    this.contactInfoDb = dbInstanceManager.getDbInstance(ContactInfoDb);
    this.statsDb = dbInstanceManager.getDbInstance(PacingStatsDb);
    this.contactDispositionHandler = new ContactDispositionHandler(this.redisClientPool);
    this.contactDispositionHandler.start();
    this.contactWorkBatcher = new WorkBatcher<ContactEvent, string>(
      // CONNECT_TODO: Make this configurable (bring it over from queue service)
      200,
      async (contactEvents) => {
        this.logger.log('silly', `Batching contact events: ${JSON.stringify(contactEvents, null, 2)}`);
        this.handleEvents(contactEvents);
        return contactEvents.map((contactEvent) => [null, 'ok']);
      }
    );
    this.contactWorkBatcher.start();
  }

  handleEvent(contactEvent: ContactEvent) {
    if (!contactEvent?.campaign?.campaignId) {
      this.logger.log(
        'silly',
        `Ignoring event for contact ${contactEvent.contactId} with no campaign (likely inbound call)`
      );
      return;
    }
    this.logger.log('silly', `Received event: ${JSON.stringify(contactEvent, null, 2)}`);
    this.contactWorkBatcher.addWork(contactEvent);
  }

  async handleEvents(contactEvents: ContactEvent[]) {
    if (contactEvents.length > 0) {
      await Promise.allSettled([this.generateStats(contactEvents), this.handleContactEvents(contactEvents)]);
    }
  }

  inferHistoricalStatsTypes(contactEvent: ContactEvent): HistoricalStatsSettableKey[] | null {
    if (!eventStatUpdateTriggers.includes(contactEvent.eventType)) {
      return null;
    }
    if (!contactEvent.initiationTimestamp) {
      this.logger.log('warn', `Contact ${contactEvent.contactId} has no initiationTimestamp; returning`);
      return null;
    }
    const toReturn: HistoricalStatsSettableKey[] = ['initiated'];
    const connectedToAgent = Boolean(contactEvent.agentInfo?.connectedToAgentTimestamp);
    const queued = Boolean(contactEvent.queueInfo?.enqueueTimestamp);
    const disconnected = Boolean(contactEvent.disconnectTimestamp);
    if (connectedToAgent) {
      toReturn.push('connected_to_agent');
    }
    if (queued) {
      toReturn.push('queued');
    }
    if (disconnected) {
      if (queued) {
        if (!connectedToAgent) {
          toReturn.push('abandoned_queue');
        } else if (connectedToAgent) {
          toReturn.push('disconnected_from_agent');
        }
      } else {
        toReturn.push('abandoned_ivr');
      }
    }
    return toReturn;
  }

  async generateStats(contactEvents: ContactEvent[]) {
    const connectCampaignIds = new Set<string>();
    const statsEvents: HistoricalStatContactEventData[] = contactEvents.reduce((acc, contactEvent) => {
      const historicalStatsTypes = this.inferHistoricalStatsTypes(contactEvent);
      if (historicalStatsTypes?.length) {
        acc.push({
          contactEvent,
          historicalStatsTypes,
        });
      }
      return acc;
    }, [] as HistoricalStatContactEventData[]);
    await this.redisClientPool.runForcePipeline((pipeline) =>
      Promise.all(
        statsEvents.map((statsEvent) => {
          const { contactEvent } = statsEvent;
          const connectCampaignId = contactEvent.campaign?.campaignId;
          if (contactEvent && connectCampaignId) {
            this.logger.log(
              'silly',
              `Generating stats for contact ${contactEvent.contactId} on Connect campaign ${connectCampaignId} - ${statsEvent.historicalStatsTypes}`
            );
            connectCampaignIds.add(connectCampaignId);
            this.statsDb.historicalStatsDb.setContactStats(
              connectCampaignId,
              statsEvent.historicalStatsTypes,
              statsEvent.contactEvent.initiationTimestamp,
              contactEvent.contactId,
              'external',
              pipeline
            );
          } else {
            this.logger.log(
              'warn',
              `Contact ${contactEvent.contactId} is no longer in flight but no contact info was found`
            );
          }
        })
      )
    );
  }

  inferDisposition(contactEvent: ContactEvent): DispositionType {
    if (contactEvent.agentInfo) {
      return 'agent_answer';
    } else if (contactEvent.queueInfo) {
      return 'abandoned_in_queue';
    } else if (contactEvent.answeringMachineDetectionStatus) {
      switch (contactEvent.answeringMachineDetectionStatus) {
        // make a case for all AnsweringMachineDetectionStatus
        case 'AMD_ERROR':
          return 'amd_error';
        case 'VOICEMAIL_BEEP':
        case 'VOICEMAIL_NO_BEEP':
          return 'answering_machine';
        case 'AMD_UNANSWERED':
          return 'no_answer';
        case 'SIT_TONE_BUSY':
          return 'busy';
        case 'SIT_TONE_INVALID_NUMBER':
          return 'invalid_number';
        case 'FAX_MACHINE_DETECTED':
          return 'fax_machine';
        case 'SIT_TONE_DETECTED':
          return 'sit_tone';
        case 'HUMAN_ANSWERED':
          return 'live_party';
        case 'AMD_UNRESOLVED':
        default:
          return 'unknown';
      }
    }
    return 'unknown';
  }

  async handleContactEvents(contactEvents: ContactEvent[]) {
    const eligibleEvents = contactEvents.filter((contactEvent) => contactInfoUpdateTriggers.includes(contactEvent.eventType));
    const contactInfos = await this.redisClientPool.runForcePipeline(async (pipeline) => {
      const promises = Promise.all(
        eligibleEvents.map((contactEvent) =>
          this.contactInfoDb.setOutboundContactInfo(
            {
              contactId: contactEvent.contactId,
              startTime: contactEvent.initiationTimestamp,
              connectedTime: contactEvent.connectedToSystemTimestamp,
              dispositionInfo: contactEvent.eventType === 'DISCONNECTED' ? {
                detectionStatus: contactEvent.answeringMachineDetectionStatus,
                disposition: this.inferDisposition(contactEvent),
                agentId: contactEvent?.agentInfo?.agentArn,
                endTime: contactEvent.disconnectTimestamp || new Date(),
              } : undefined,
            },
            {
              onCompleteAction: 'delete',
              setPipeline: pipeline,
            }
          )
        )
      );
      return promises;
    });
    for (const contactInfo of contactInfos) {
      if (contactInfo.isComplete) {
        this.contactDispositionHandler.handleContactDisposition(contactInfo.contactInfo);
      }
    }
  }

}