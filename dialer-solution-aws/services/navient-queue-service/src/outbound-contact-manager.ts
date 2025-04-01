import crypto from 'crypto';
import chalk from 'chalk';
import { CampaignExecutionDefinition } from 'navient-common/lib/models/campaign-execution';
import { CacheRecord, getRecordLatestAllowableTime } from 'navient-common/lib/models/cache-record';
import { serviceConfig } from './config/config';
import { Logger } from 'navient-services-common/lib/logger/logger';
import { CampaignExecutionDb } from 'navient-services-common/lib/db/campaign-execution-db';
import { ConnectInstanceServiceManager } from 'navient-services-common/lib/utils/connect-helper';
import { globalConfigCache, redisClientPool } from './globals';
import { QueueManager } from './queue-manager';
import { ExecutableRecord, QueueDb } from 'navient-services-common/lib/db/queue-db';
import { setTimeoutLoop } from 'navient-services-common/lib/utils/general';
import { ServiceManager } from 'navient-services-common/lib/utils/service-manager';
import { DescribeContactCommand, StartOutboundVoiceContactCommand, StopContactCommand } from '@aws-sdk/client-connect';
import { ConnectInstanceService } from 'navient-services-common/lib/utils/connect-instance-service';
import { ContactInfoDb } from 'navient-services-common/lib/db/contact-info-db';
import { HistoricalStatsDb } from 'navient-services-common/lib/db/historical-stats-db';

export class OutboundContactManager {
  protected readonly logger: Logger = Logger.getLogger();
  serviceManager: ServiceManager = ServiceManager.getInstance();
  campaignExecutionDb: CampaignExecutionDb;
  contactInfoDb: ContactInfoDb;
  historicalStatsDb: HistoricalStatsDb;
  dequeuedPending: Map<string, Set<string>> = new Map();
  // Only used for dev purposes
  callsPlaced: number = 0;

  constructor(private readonly queueManager: QueueManager, private readonly queueDb: QueueDb) {
    this.campaignExecutionDb = new CampaignExecutionDb(redisClientPool);
    this.contactInfoDb = new ContactInfoDb(redisClientPool);
    this.historicalStatsDb = new HistoricalStatsDb(redisClientPool);
  }

  async start() {
    let lastCheckTime = Date.now() - serviceConfig.queue.dequeueFrequency;
    const connectInstanceServiceManager = ConnectInstanceServiceManager.getInstance();
    const queuedExecutions: {
      record: ExecutableRecord;
      campaignExecution: CampaignExecutionDefinition | undefined;
    }[] = [];
    let [currentGlobal, currentConnectInfo] = await redisClientPool.runForcePipeline((pipeline) =>
      Promise.all([globalConfigCache.get(pipeline), connectInstanceServiceManager.get(pipeline)])
    );
    await setTimeoutLoop(
      async () => {
        let now = Date.now();
        const timeWindow = now - lastCheckTime;
        lastCheckTime = now;

        [currentGlobal, currentConnectInfo] = await redisClientPool.runForcePipeline((pipeline) =>
          Promise.all([globalConfigCache.get(pipeline), connectInstanceServiceManager.get(pipeline)])
        );

        const localCPS = this.calculateLocalRecordsPerSecond(currentGlobal!.Connect.ConnectProjectCPS || 0);
        let numRecordsToPull = Math.round((localCPS * timeWindow) / 1000);
        this.logger.log(
          'info',
          `Dequeueing ${numRecordsToPull} records based on local CPS of ${localCPS} and time since last dequeue ${timeWindow}ms ago`
        );

        const recordsToDial: ExecutableRecord[] = [];
        const ignoredCampaignExecs = new Set<string>();
        while (numRecordsToPull > 0) {
          const dequeuedRecords = await this.queueDb.dequeueRecords(numRecordsToPull);
          const allowableDequeuedRecords = dequeuedRecords.filter((record) => {
            if (this.isRecordCallableAt(record, now)) {
              return true;
            }
            ignoredCampaignExecs.add(record.campaignExecutionId);
            return false;
          });
          allowableDequeuedRecords.forEach((record) => {
            record.cacheRecord &&
              record.campaignExecutionId &&
              this.addPendingCall(record.campaignExecutionId, record.cacheRecord);
          });
          const ignoredRecords = dequeuedRecords.length - allowableDequeuedRecords.length;
          this.logger.log(
            'info',
            `Dequeued ${dequeuedRecords.length} records${
              ignoredRecords > 0 ? `, ignored ${ignoredRecords} as last allowable dial time has been exceeded` : ''
            }`
          );
          recordsToDial.push(...allowableDequeuedRecords);
          numRecordsToPull = ignoredRecords;
        }
        redisClientPool.runForcePipeline((pipeline) =>
          Promise.all(
            [...ignoredCampaignExecs].map((ignoredCampaignExecId) =>
              this.queueManager.checkEndStateFromDb(ignoredCampaignExecId, pipeline)
            )
          )
        );

        const campaignExecutionKeys = new Set<string>(recordsToDial.map((record) => record.campaignExecutionId));
        const campaignExecutions = await this.campaignExecutionDb.mgetMap([...campaignExecutionKeys]);
        queuedExecutions.unshift(
          ...recordsToDial
            .map((record) => {
              return {
                record,
                campaignExecution: campaignExecutions.get(record.campaignExecutionId),
              };
            })
            .filter((toQueue) => toQueue.campaignExecution)
        );
        return true;
      },
      'Record dequeue',
      serviceConfig.queue.dequeueFrequency,
      {
        immediate: true,
      }
    );
    setTimeoutLoop(
      async () => {
        const now = Date.now();
        const localCPS = this.calculateLocalRecordsPerSecond(currentGlobal!.Connect.ConnectProjectCPS);
        let toExecute = queuedExecutions.pop();
        while (toExecute && !this.isRecordCallableAt(toExecute.record, now)) {
          this.logger.log('info', `Not dialling record as campaign has ended or lastAllowable time has passed`, {
            entity: toExecute.campaignExecution,
          });
          toExecute = queuedExecutions.pop();
        }
        if (toExecute) {
          const {
            campaignExecution,
            record: { cacheRecord },
          } = toExecute;
          if (!campaignExecution) {
            this.logger.log('info', `Campaign execution does not exist for record`);
            return 0;
          }
          if (!cacheRecord) {
            this.logger.log('info', `Cache record does not exist for record`, {
              entity: campaignExecution,
            });
            return 0;
          }
          this.executeFlow(currentConnectInfo, cacheRecord, campaignExecution);
        }
        return localCPS > 0 ? 1000 / localCPS : 1000;
      },
      'Flow executor',
      1,
      {
        immediate: true,
      }
    );
    const outboundContactsConfig = serviceConfig.outboundContacts;
    const { ringTimeoutCheckFrequency, checkContactBeforeCompletion, maxRingTimeoutHangupsPerLoop } =
      outboundContactsConfig;
    const maxRingtimeCheckerJob = await this.serviceManager.whileJob(
      'max_ring_time_checker',
      'Max ring time checker',
      ringTimeoutCheckFrequency,
      async (firstRun) => {
        const maxRingTimeMs = (currentGlobal?.DialerDefaults.MaxRingTime || 0) * 1000;
        if (firstRun) {
          this.logger.log('info', `Max ring time checker started with max ring time of ${maxRingTimeMs}ms`);
          // Clear all old ringing contacts > 60 seconds (as this is the Connect max ring time)
          const clearedKeys = await this.contactInfoDb.clearRingingContacts(60000);
          if (clearedKeys.length) {
            this.logger.log('info', `Cleared ${clearedKeys.length} old ringing contacts`);
          }
        }
        if (!maxRingTimeMs) {
          return true;
        }
        this.logger.log(
          'silly',
          `Checking for contacts that have been ringing for longer than ${maxRingTimeMs}ms (max ${maxRingTimeoutHangupsPerLoop} per loop)`
        );
        const longRingingContacts = (
          await this.contactInfoDb.getRingingContactInfos({
            longerThan: maxRingTimeMs,
          })
        ).filter((contact) => !contact.manualStopTriggerTime).slice(0, maxRingTimeoutHangupsPerLoop);
        if (!longRingingContacts.length) {
          return true;
        }
        this.logger.log(
          'debug',
          `Found ${longRingingContacts.length} contacts that have been ringing for too long (> ${maxRingTimeMs}ms)`
        );
        // Dev mode, skip flow execution so simulate contact ended
        if (serviceConfig.dev.skipFlowExecution) {
          await redisClientPool.runForcePipeline(async (pipeline) => {
            for (const contact of longRingingContacts) {
              this.logger.log(
                'debug',
                `Contact ${contact.contactId} has been ringing for too long, stopping: ${JSON.stringify(contact)}`
              );
              const connectCampaignId = contact.campaignInfo?.connectCampaignId;
              const startDate = contact.creationTime;
              const contactId = contact.contactId;
              const campaignExecId = contact.campaignInfo?.campaignExecutionId;
              const cacheRecord = contact.campaignInfo?.cacheRecord;
              if (!connectCampaignId || !startDate || !campaignExecId || !cacheRecord) {
                this.logger.log(
                  'warn',
                  `Contact ${contactId} has missing field(s), skipping historical stats update. connectCampaignId: ${connectCampaignId}, startDate: ${startDate}, campaignExecId: ${campaignExecId}, cacheRecord: ${cacheRecord}`
                );
                continue;
              }
              this.historicalStatsDb.setContactStats(
                connectCampaignId,
                'abandoned_ivr',
                startDate,
                contactId,
                'external'
              );
              this.contactInfoDb.removeOutboundContactInfo(contactId, pipeline);
              this.removePendingCall(campaignExecId, cacheRecord);
            }
          });
        } else {
          await redisClientPool.runForcePipeline(async (pipeline) => {
            for (const contact of longRingingContacts) {
              this.contactInfoDb.setOutboundContactInfo(
                {
                  contactId: contact.contactId,
                  manualStopTriggerTime: new Date(),
                },
                {
                  onCompleteAction: 'delete',
                  setPipeline: pipeline,
                }
              );
            }
            const connectClient = currentConnectInfo.connectClient;
            await Promise.allSettled(
              longRingingContacts.map(async (contactInfo) => {
                const contactId = contactInfo.contactId;
                const instanceId = currentConnectInfo.connectConfig.InstanceId;
                if (checkContactBeforeCompletion) {
                  const contactResult = await connectClient.send(
                    new DescribeContactCommand({ ContactId: contactId, InstanceId: instanceId })
                  );
                  if (!contactResult) {
                    this.logger.log('debug', `Contact ${contactId} exceeded ring time but contact not found, ignoring`);
                    return;
                  }
                  if (contactResult.Contact?.ConnectedToSystemTimestamp) {
                    this.logger.log('debug', `Contact ${contactId} exceeded ring time but connected, not stopping`);
                    return;
                  }
                }
                this.logger.log(
                  'debug',
                  `Contact ${contactInfo.contactId} has been ringing for too long. Contact start time: ${
                    contactInfo.startTime
                  }, ringing duration: ${contactInfo.getRingingDuration()}ms, max ring time: ${maxRingTimeMs}ms`
                );
                const stopContactCommand = new StopContactCommand({
                  ContactId: contactId,
                  InstanceId: instanceId,
                });
                connectClient
                  .send(stopContactCommand)
                  .then((result) => {
                    this.logger.log('info', `Contact ${contactInfo.contactId} stopped due to max ring time`);
                  })
                  .catch((e) => {
                    this.logger.log('error', ['Error stopping contact', e]);
                  });
              })
            );
          });
        }

        return true;
      }
    );
  }

  public isRecordCallableAt(record: ExecutableRecord, dateTime: number) {
    const latestAllowableServerTime = record.cacheRecord ? record.cacheRecord.latestAllowableServerTime : undefined;
    if (record.cacheRecord && latestAllowableServerTime) {
      const lastAllowableDate = getRecordLatestAllowableTime(record.cacheRecord, serviceConfig.crudApi.crudApiTimezone);
      if (lastAllowableDate.getTime() < dateTime) {
        this.logger.log(
          'info',
          `Not dialling record as latestAllowableServerTime (${latestAllowableServerTime} in timezone ${
            serviceConfig.crudApi.crudApiTimezone
          } translated to ${lastAllowableDate.toISOString()}) has passed`,
          { entityId: record.campaignExecutionId }
        );
        return false;
      }
    }
    if (record.executionEndBy < dateTime) {
      this.logger.log(
        'info',
        `Not dialling record as campaign execution end time (${new Date(
          record.executionEndBy
        ).toISOString()}) has passed`,
        { entityId: record.campaignExecutionId }
      );
      return false;
    }
    return true;
  }

  calculateLocalRecordsPerSecond(globalCPSLimit: number) {
    // We can't use rate limiter any more as time between requests is dynamic based on number
    // of running queue services
    const servicePos = this.serviceManager.getServicePosition();
    const activeServiceCount = this.serviceManager.getActiveServiceCount();
    if (activeServiceCount === 0) {
      return 0;
    }
    let localCPS = Math.floor(globalCPSLimit / activeServiceCount);
    const remainder = globalCPSLimit - localCPS * activeServiceCount;
    if (servicePos < remainder) {
      localCPS += 1;
    }
    // this.logger.log('silly', `Local CPS is ${localCPS} based on global CPS of ${globalCPSLimit}, service pos: ${servicePos} and active service count: ${activeServiceCount}`)
    return localCPS;
  }

  async executeFlow(
    connectService: ConnectInstanceService,
    cacheRecord: CacheRecord,
    campaignExecution: CampaignExecutionDefinition
  ) {
    if (this.callsPlaced >= (serviceConfig.dev.totalCallLimit || Infinity)) {
      this.logger.log('info', `Already placed ${this.callsPlaced}, total call limit reached, not dialling record`, {
        entity: campaignExecution,
      });
      return;
    }
    this.callsPlaced += 1;
    try {
      await this.campaignExecutionDb.incrementRecordsAttempted(campaignExecution).catch((e) =>
        this.logger.mlog('warn', ["Can't increment records:", e], {
          entity: campaignExecution,
        })
      );
      const contactFlowId = campaignExecution.contactFlowId;
      const to = serviceConfig.dev.destinationPhoneNumber
        ? serviceConfig.dev.destinationPhoneNumber
        : cacheRecord.phoneNumber;

      if (!to) {
        throw 'No destination phone number specified';
      }

      this.logger.log(
        'debug',
        chalk.yellow(`${campaignExecution.id} Triggering contact flow ${contactFlowId} to phone number ${to}`),
        { entity: campaignExecution }
      );

      let from: string;
      if (cacheRecord.CL_caller_id && cacheRecord.CL_caller_id.length > 0) {
        from = cacheRecord.CL_caller_id;
        this.logger.log('verbose', `Setting from number to ${from} from cache record's CL_caller_id`);
      } else {
        from = campaignExecution.campaign.BaseConfig.Callerid;
        this.logger.log('info', `Setting from number to ${from} from campaign's Callerid`);
      }

      this.logger.log(
        'debug',
        `Triggering contact flow ${contactFlowId} on campaign exec ${campaignExecution.id} To: ${to} From: ${from}`,
        { entity: campaignExecution }
      );

      let contactId: string;
      const creationTime = new Date();

      if (serviceConfig.dev.skipFlowExecution) {
        contactId = crypto.randomBytes(32).toString('hex').toUpperCase();
      } else {
        const { connectClient, connectConfig } = connectService;
        const command = new StartOutboundVoiceContactCommand({
          InstanceId: connectConfig.InstanceId,
          ContactFlowId: contactFlowId,
          DestinationPhoneNumber: to,
          SourcePhoneNumber: from,
          QueueId: campaignExecution.campaign.BaseConfig.Queue,
          CampaignId: campaignExecution.campaign.ConnectCampaignId,
          AnswerMachineDetectionConfig: campaignExecution.amDetection
            ? {
                EnableAnswerMachineDetection: campaignExecution.amDetection,
                AwaitAnswerMachinePrompt: false,
              }
            : undefined,
          TrafficType: campaignExecution.amDetection ? 'CAMPAIGN' : 'GENERAL',
          Attributes: this.buildContactFlowAttributes(connectConfig.InstanceId, campaignExecution, cacheRecord),
        });
        // CONNECT_TODO: The response to this should give us a Contact Id we can track against
        // (not outbound contact IDs)
        const response = await connectClient.send(command);
        if (!response.ContactId) {
          throw 'No contact ID returned';
        }
        contactId = response.ContactId;
      }

      this.queueManager.contactStarted(contactId, campaignExecution);
      this.logger.log('verbose', `Contact Started, contact ID: ${contactId}`, {
        entity: campaignExecution,
      });
      const startDate = new Date();
      await redisClientPool.runForcePipeline((pipeline) => {
        return Promise.all([
          this.historicalStatsDb.setContactStats(
            campaignExecution.campaign,
            'initiated',
            startDate,
            contactId,
            'internal',
            pipeline
          ),
          this.contactInfoDb.setOutboundContactInfo(
            {
              contactId,
              creationTime,
              campaignInfo: {
                campaignId: campaignExecution.campaign.id,
                campaignExecutionId: campaignExecution.id,
                contactFlowId,
                connectCampaignId: campaignExecution.campaign.ConnectCampaignId,
                cacheRecord,
                callingMode: campaignExecution.campaign.BaseConfig.CallingMode,
                systemEndpoint: from,
              },
              sequenceInfo: {
                livePartyBehavior: campaignExecution.livePartyBehavior,
                answeringMachineBehavior: campaignExecution.answeringMachineBehavior,
              },
            },
            {
              onCompleteAction: 'mark_ready',
              setPipeline: pipeline,
            }
          ),
          this.campaignExecutionDb.setLastDialTime(campaignExecution, startDate, pipeline),
        ]);
      });
      this.removePendingCall(campaignExecution.id, cacheRecord);
      return contactId;
    } catch (e) {
      this.logger.mlog('error', ['Error executing flow', e]);
      this.queueManager.outboundContactFailed(campaignExecution, cacheRecord, e);
    } finally {
      this.removePendingCall(campaignExecution.id, cacheRecord);
    }
  }

  buildContactFlowAttributes(
    instanceId: string,
    campaignExecution: CampaignExecutionDefinition,
    cacheRecord: CacheRecord
  ): Record<string, any> {
    // Contact flow attributes are flat (no nested objects)
    // We have the following options:
    // 1. Spread them into the base level of the object
    // 2. Spread them into the base level of the object prepended with the name of the attribute
    // (e.g. custom_attribute.name)
    // 3. JSON.stringify them and put them in a single attribute
    const toReturn: Record<string, string> = {
      record_info: JSON.stringify(cacheRecord),
      live_party_behavior: campaignExecution.livePartyBehavior,
      answering_machine_behavior: campaignExecution.answeringMachineBehavior,
      calling_mode: campaignExecution.campaign.BaseConfig.CallingMode,
    };
    if (campaignExecution.campaign.BaseConfig.Queue) {
      toReturn.queue_id = campaignExecution.campaign.BaseConfig.Queue;
    }
    if (campaignExecution.livePartyBehavior === 'PASS_TO_CONTACT_FLOW' && campaignExecution.livePartyContactFlow) {
      toReturn.live_party_contact_flow = campaignExecution.livePartyContactFlow;
    }
    if (
      campaignExecution.answeringMachineBehavior === 'PASS_TO_CONTACT_FLOW' &&
      campaignExecution.answeringMachineContactFlow
    ) {
      toReturn.answering_machine_contact_flow = campaignExecution.answeringMachineContactFlow;
    }
    campaignExecution.campaign.CustomAttributes.ActiveAttributes.forEach((attribute) => {
      toReturn[attribute.Name] = attribute.Value;
    });
    return toReturn;
  }

  /*
    This exists because, after dequeueing a record, there is a possible delay before the record is actually dialled and therefore
    a delay before the contact id is added to the list of current active contact IDs
    On Amazon connect this can be as much as 0.5s which could skew pacing as we have a false representation of what's actually dialled
    At this point the record to dial only exists in memory anyway so we can keep a set of all pending dials
  */
  private addPendingCall(campaignExecutionId: string, cacheRecord: CacheRecord) {
    let set = this.dequeuedPending.get(campaignExecutionId);
    if (!set) {
      set = new Set();
      this.dequeuedPending.set(campaignExecutionId, set);
    }
    set.add(`${campaignExecutionId}:${cacheRecord.cache_ID}:${cacheRecord.phoneNumber}`);
  }

  private removePendingCall(campaignExecutionId: string, cacheRecord: CacheRecord) {
    const set = this.dequeuedPending.get(campaignExecutionId);
    set?.delete(`${campaignExecutionId}:${cacheRecord.cache_ID}:${cacheRecord.phoneNumber}`);
    if (set?.size === 0) {
      this.dequeuedPending.delete(campaignExecutionId);
    }
  }

  public countPendingCalls(campaignExecutionId: string) {
    return this.dequeuedPending.get(campaignExecutionId)?.size || 0;
  }
}
