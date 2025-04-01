import { Transform, Type } from 'class-transformer';
import { transformAndValidate } from 'class-transformer-validator';
import { IsDate, IsIn, IsInstance, IsOptional, IsString, ValidateNested } from 'class-validator';
import { EventBridgeEvent } from '../eventbridge-event';
import camelcaseKeys from 'camelcase-keys';

export function TransformUppercase() {
  return Transform(({ value }) => value.toUpperCase());
}
export const ContactEventTypes = [
  'INITIATED',
  'CONNECTED_TO_SYSTEM',
  'QUEUED',
  'CONNECTED_TO_AGENT',
  'DISCONNECTED',
  'CONTACT_DATA_UPDATED'
] as const;
export type ContactEventType = (typeof ContactEventTypes)[number];

export const ContactChannels = ['VOICE', 'CHAT', 'TASK'] as const;
export type ContactChannel = (typeof ContactChannels)[number];

export const InititationMethods = [
  'INBOUND',
  'OUTBOUND',
  'TRANSFER',
  'CALLBACK',
  'API',
  'QUEUE_TRANSFER',
  'EXTERNAL_OUTBOUND',
  'MONITOR',
  'DISCONNECT',
] as const;
export type InititationMethod = (typeof InititationMethods)[number];

const answeringMachineDetectionStatusTypes = [
  'HUMAN_ANSWERED',
  'VOICEMAIL_BEEP',
  'VOICEMAIL_NO_BEEP',
  'AMD_UNANSWERED',
  'AMD_UNRESOLVED',
  'SIT_TONE_BUSY',
  'SIT_TONE_INVALID_NUMBER',
  'SIT_TONE_DETECTED',
  'FAX_MACHINE_DETECTED',
  'AMD_ERROR',
] as const;
export type AnsweringMachineDetectionStatus = (typeof answeringMachineDetectionStatusTypes)[number];

export class QueueInfo {
  @IsString()
  queueType!: string;
  @IsString()
  queueArn!: string;
  @IsDate()
  @Type(() => Date)
  enqueueTimestamp!: Date;
};

export class AgentInfo {
  @IsString()
  agentArn!: string;
  @IsDate()
  @Type(() => Date)
  connectedToAgentTimestamp!: Date;
};

export class Campaign {
  @IsString()
  campaignId!: string;
}


// TransformUpperCase necessary because the Amazon Connect events are inconsistent with their casing
// Example from their own docs: channel can be "Voice" or "VOICE". It could probably be vOIcE
export class ContactEvent {
  @IsDate()
  @Type(() => Date)
  initiationTimestamp!: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  connectedToSystemTimestamp?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  disconnectTimestamp?: Date;

  @TransformUppercase()
  @IsIn(ContactEventTypes)
  eventType!: ContactEventType;

  @IsString()
  contactId!: string;

  @IsString()
  @IsOptional()
  initialContactId?: string;

  @IsString()
  @IsOptional()
  previousContactId?: string;

  @IsString()
  @IsOptional()
  relatedContactId?: string;

  @IsString()
  @IsOptional()
  instanceArn!: string;

  @TransformUppercase()
  @IsIn(ContactChannels)
  channel!: ContactChannel;

  @Type(() => QueueInfo)
  @IsInstance(QueueInfo)
  @ValidateNested()
  @IsOptional()
  queueInfo?: QueueInfo;

  @Type(() => AgentInfo)
  @IsInstance(AgentInfo)
  @ValidateNested()
  @IsOptional()
  agentInfo?: AgentInfo;

  @Type(() => Campaign)
  @IsInstance(Campaign)
  @ValidateNested()
  @IsOptional()
  campaign?: Campaign;

  @TransformUppercase()
  initiationMethod!: InititationMethod;

  @IsString()
  @IsOptional()
  @TransformUppercase()
  answeringMachineDetectionStatus?: AnsweringMachineDetectionStatus | string;
}

export class ContactEventBridgeEvent extends EventBridgeEvent {
  @IsInstance(ContactEvent)
  @Type(() => ContactEvent)
  @ValidateNested()
  // @Transform(({ value }) => transformContactEventDetail(value))
  detail!: ContactEvent;
}
  

// export const transformContactEventDetail = async(event: any): Promise<ContactEvent> => {
//   // Looking at the docs the key naming is weirdly inconsistent - sometimes the keys are UpperCamelCase and sometimes they are lowerCamelCase
//   // As an example, sometimes agentInfo is "agentInfo" and sometimes it's "AgentInfo"
//   // Using camelcaseKeys with deep: true will convert all keys to lowerCamelCase
//   return await transformAndValidate(ContactEvent, camelcaseKeys(event, {
//     deep: true,
//   })) as ContactEvent;
// };

export const transformContactEvent = async (event: any): Promise<ContactEventBridgeEvent> => {
  // Of course there's one kebab-case exception to the camelCase rule
  return await transformAndValidate(
    ContactEventBridgeEvent,
    camelcaseKeys(event, {
      deep: true,
      exclude: ['detail-type'],
    })
  ) as ContactEventBridgeEvent;
};
