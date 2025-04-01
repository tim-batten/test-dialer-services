import { IsDate, IsEnum, IsIn, IsInstance, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CacheRecord } from './cache-record';
import { Type } from 'class-transformer';
import { CallingMode, CallingModes } from './campaign';
import { ConnectionAction } from './schedule';

export const dispositionTypes = ['busy', 'no_answer', 'fax_machine', 'invalid_number', 'live_party', 'answering_machine', 'failed', 'abandoned_in_queue', 'agent_answer', 'sit_tone', 'amd_error', 'unknown'] as const;
export type DispositionType = (typeof dispositionTypes)[number];

// TODO: Split into the dialler context and disposition context (so I guess CampaignInfo, DispositionInfo)
// That may make JSON update a bit iffy though.

class CampaignInfo {
  @IsString()
  campaignId!: string;

  @IsString()
  connectCampaignId!: string;

  @IsString()
  campaignExecutionId!: string;

  @IsString()
  contactFlowId!: string;

  @IsString()
  /** This is the from number */
  systemEndpoint!: string;

  @IsIn(CallingModes)
  callingMode!: CallingMode;

  @IsInstance(CacheRecord)
  @ValidateNested()
  @Type(() => CacheRecord)
  cacheRecord!: CacheRecord;
}

class DispositionInfo {
  @IsString()
  disposition!: DispositionType;

  @IsString()
  @IsOptional()
  detectionStatus?: string;

  @IsString()
  @IsOptional()
  agentId?: string;

  @IsDate()
  @Type(() => Date)
  endTime!: Date;
}

class SequenceInfo {
  @IsEnum(ConnectionAction)
  livePartyBehavior!: ConnectionAction;

  @IsEnum(ConnectionAction)
  answeringMachineBehavior!: ConnectionAction;
}

export class OutboundContactInfo {
  @IsString()
  contactId!: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startTime?: Date;

  @IsInstance(CampaignInfo)
  @ValidateNested()
  @Type(() => CampaignInfo)
  @IsOptional()
  campaignInfo?: CampaignInfo;

  @IsInstance(SequenceInfo)
  @ValidateNested()
  @Type(() => SequenceInfo)
  @IsOptional()
  sequenceInfo?: SequenceInfo;

  @IsInstance(DispositionInfo)
  @ValidateNested()
  @Type(() => DispositionInfo)
  @IsOptional()
  dispositionInfo?: DispositionInfo;
}