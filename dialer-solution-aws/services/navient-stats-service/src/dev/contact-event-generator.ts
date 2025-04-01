import { Contact } from '@aws-sdk/client-connect';
import { OutboundContactInfo } from 'navient-common/lib/models/outbound-contact-info';
import { ContactInfoDb } from 'navient-services-common/lib/db/contact-info-db';
import {
  AnsweringMachineDetectionStatus,
  ContactEvent,
  ContactEventType,
} from 'navient-services-common/lib/types/amazon-connect/contact-event';
import { setTimeoutLoop } from 'navient-services-common/lib/utils/general';
import { ContactEventHandler } from '../handlers/contact-event-handler';
import { ContactEventGeneratorOpts, FinalCallStatus, OutcomeThresholds } from './contact-event-config-opts';

type ContactEventInfo = {
  contactInfo: OutboundContactInfo;
  lastEventGenerated?: {
    event: ContactEvent;
    timestamp: number;
  };
  outcome: FinalCallStatus;
  ringTime: number;
  connectedTime: number;
};

const contactMap = new Map<string, ContactEventInfo>();

/**
 * This is a very basic class to generate contact events for testing purposes.
 * It distributes contacts across different outcomes and generates events based on the desired outcome.
 * There are 2 time related parameters:
 * - ringTime: The time the contact will ring before being answered or disconnected
 * - connectedTime: The time the contact will be connected before being disconnected
 * If a contact proceeds beyond the ringTime, every subsequent event will be generated
 * each iteration of the Contact Event Generator setTimeoutLoop, and then the final disconnect event will be generated
 * after the connectedTime has passed.
 *
 * This was a quick solution so don't expect accuracy - the ringTime is going to be anything from
 * ringTime.min to ringTime.max + 100 ms and the connectedTime is
 * going to be anything from connectedTime.min to connectedTime.max + 100 ms.
 * It can go beyond this if the desired connected time is low but the
 * desired outcome requires multiple iterations to reach the final event (at most 300ms). This is a known issue
 * but is not worth putting the engineering effort into fixing as this is just a quick way
 * to test some normal flows.
 *
 * Also note that because this is all in memory it won't really work with multiple
 * stats services running at the same time.
 */
export class ContactEventGenerator {
  thresholds: OutcomeThresholds = new OutcomeThresholds(this.opts.outcomes);
  constructor(
    readonly contactInfoDb: ContactInfoDb,
    readonly contactEventHandler: ContactEventHandler,
    readonly opts: ContactEventGeneratorOpts
  ) {}

  start() {
    setTimeoutLoop(
      async () => {
        const contactInfos = await this.contactInfoDb.getContactInfosOlderThan(0);
        for (const dbContactInfo of contactInfos) {
          const contactId = dbContactInfo.contactId;
          let contactEventInfo = contactMap.get(contactId);
          if (!contactEventInfo) {
            contactEventInfo = {
              contactInfo: dbContactInfo,
              outcome: this.thresholds.getOutcome(),
              ringTime: this.makeRingTime(),
              connectedTime: this.makeConnectedTime(),
            };
            contactMap.set(contactId, contactEventInfo);
          }
          contactEventInfo.contactInfo = dbContactInfo;
        }
        return true;
      },
      'Contact Info fetcher',
      1000
    );
    setTimeoutLoop(
      async () => {
        for (const contactEventInfo of contactMap.values()) {
          const contactEvent = this.generateNextEvent(contactEventInfo);
          if (!contactEvent) {
            continue;
          }
          contactEventInfo.lastEventGenerated = {
            event: contactEvent,
            timestamp: Date.now(),
          };
          this.contactEventHandler.handleEvent(contactEvent);
        }
        return true;
      },
      'Contact Event Generator',
      100
    );
  }

  makeRingTime() {
    return Math.random() * (this.opts.ringTime.max - this.opts.ringTime.min) + this.opts.ringTime.min;
  }

  makeConnectedTime() {
    return Math.random() * (this.opts.connectedTime.max - this.opts.connectedTime.min) + this.opts.connectedTime.min;
  }

  generateNextEvent(contactEventInfo: ContactEventInfo) {
    if (!contactEventInfo.lastEventGenerated) {
      return generateContactEvent(contactEventInfo.contactInfo, 'INITIATED');
    }
    const lastEvent = contactEventInfo.lastEventGenerated.event;
    const outcome = contactEventInfo.outcome;
    const contactRingingDuration = Date.now() - contactEventInfo.lastEventGenerated.event.initiationTimestamp.getTime();
    const contactConnectedDuration =
      Date.now() - (contactEventInfo.lastEventGenerated.event.connectedToSystemTimestamp?.getTime() || Date.now());
    switch (lastEvent.eventType) {
      case 'INITIATED': {
        if (outcome === 'BUSY') {
          return generateContactEvent(contactEventInfo.contactInfo, 'DISCONNECTED', lastEvent, 'SIT_TONE_BUSY');
        }
        if (contactRingingDuration < contactEventInfo.ringTime) {
          return;
        }
        if (outcome === 'NO_ANSWER') {
          return generateContactEvent(contactEventInfo.contactInfo, 'DISCONNECTED', lastEvent, 'AMD_UNANSWERED');
        }
        return generateContactEvent(
          contactEventInfo.contactInfo,
          'CONNECTED_TO_SYSTEM',
          lastEvent,
          outcome === 'MACHINE' ? 'VOICEMAIL_BEEP' : 'HUMAN_ANSWERED'
        );
      }
      case 'CONNECTED_TO_SYSTEM': {
        if (outcome === 'ABANDONED_IVR') {
          if (contactConnectedDuration < contactEventInfo.connectedTime) {
            return;
          }
          return generateContactEvent(contactEventInfo.contactInfo, 'DISCONNECTED', lastEvent);
        }
        return generateContactEvent(contactEventInfo.contactInfo, 'QUEUED', lastEvent);
      }
      case 'QUEUED': {
        if (outcome === 'ABANDONED_QUEUE') {
          if (contactConnectedDuration < contactEventInfo.connectedTime) {
            return;
          }
          return generateContactEvent(contactEventInfo.contactInfo, 'DISCONNECTED', lastEvent);
        }
        return generateContactEvent(contactEventInfo.contactInfo, 'CONNECTED_TO_AGENT', lastEvent);
      }
      case 'CONNECTED_TO_AGENT': {
        if (contactConnectedDuration < contactEventInfo.connectedTime) {
          return;
        }
        return generateContactEvent(contactEventInfo.contactInfo, 'DISCONNECTED', lastEvent);
      }
    }
  }
}

const generateContactEvent = (
  contactInfo: OutboundContactInfo,
  eventType: ContactEventType,
  lastEvent: ContactEvent | null = null,
  amdStatus: AnsweringMachineDetectionStatus | undefined = undefined
): ContactEvent => {
  const baseEvent = lastEvent || makeInitialContactEvent(contactInfo);
  return {
    ...baseEvent,
    eventType,
    connectedToSystemTimestamp: eventType === 'CONNECTED_TO_SYSTEM' ? new Date() : baseEvent.connectedToSystemTimestamp,
    disconnectTimestamp: eventType === 'DISCONNECTED' ? new Date() : baseEvent.disconnectTimestamp,
    answeringMachineDetectionStatus: amdStatus || lastEvent?.answeringMachineDetectionStatus,
    agentInfo:
      eventType === 'CONNECTED_TO_AGENT'
        ? { agentArn: '1234', connectedToAgentTimestamp: new Date() }
        : lastEvent?.agentInfo,
    queueInfo:
      eventType === 'QUEUED'
        ? { enqueueTimestamp: new Date(), queueArn: '1234', queueType: 'QUEUE' }
        : lastEvent?.queueInfo,
  };
};

const makeInitialContactEvent = (contactInfo: OutboundContactInfo): ContactEvent => {
  const connectCampaignId = contactInfo.campaignInfo?.connectCampaignId;
  return {
    eventType: 'INITIATED',
    contactId: contactInfo.contactId,
    initiationTimestamp: new Date(),
    campaign: connectCampaignId ? { campaignId: connectCampaignId } : undefined,
    channel: 'VOICE',
    instanceArn: '1234',
    initiationMethod: 'OUTBOUND',
  };
};
