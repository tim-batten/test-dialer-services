import {
  IsDate,
  IsEnum,
  IsInstance,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { plainToClass, Transform, Type } from 'class-transformer';
import _ from 'lodash';

import { CampaignDefinition, CampaignPacingDefinition } from './campaign';
import { ScheduleDefinition, ScheduleSequenceDefinition } from './schedule';
import { ContactListDefinition } from './contact-list';
import { defaultCRUDTransformValidationOptions } from '../utils/validation';
import { transformAndValidateSync } from 'class-transformer-validator';
import { FilterDefinition } from './filter';
import { EntityRelationship } from '../db/entity-relationships';
import { DbEntity, EntityRelationshipType, Transformable } from './db-entity';
import { getISODateString } from '../utils/date-helper';
import { LogEntity } from '../types/logger';

export enum ScheduleExecutionStatus {
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  STOPPING = 'STOPPING',
}

export class ScheduleExecutionState extends Transformable {
  @IsNumber()
  currentSequenceIndex: number = -1;

  @IsNumber()
  currentSequenceLoop: number = 0;

  @IsOptional()
  @IsString()
  currentCampaignExecutionId: string | undefined;

  @IsString({
    each: true,
  })
  campaignExecutionIds: string[] = [];

  updateCampaignExecutionId(campaignExecutionId: string) {
    this.currentCampaignExecutionId = campaignExecutionId;
    this.campaignExecutionIds.push(campaignExecutionId);
  }
}

export class ScheduleExecutionFilterDefinition {
  @IsString()
  id!: string;

  @IsInt()
  filterId!: number;

  @IsString()
  filterName!: string;

  public static from(filter: FilterDefinition) {
    const toReturn = new ScheduleExecutionFilterDefinition();
    toReturn.id = filter.id;
    toReturn.filterId = filter.filterID;
    toReturn.filterName = filter.filterName;
    return toReturn;
  }
}

export class ScheduleExecutionDefinition extends Transformable implements DbEntity, LogEntity {
  static ENTITY_TYPE = 'schedule_execution';

  @IsString()
  id: string = '';

  @IsInstance(ScheduleDefinition)
  @Type(() => ScheduleDefinition)
  schedule!: ScheduleDefinition;

  @IsInstance(CampaignDefinition)
  @Type(() => CampaignDefinition)
  campaign!: CampaignDefinition;

  @IsInstance(ContactListDefinition)
  @Type(() => ContactListDefinition)
  contactList!: ContactListDefinition;

  @IsInstance(ScheduleExecutionFilterDefinition, {
    each: true,
  })
  @Type(() => ScheduleExecutionFilterDefinition)
  filterData: ScheduleExecutionFilterDefinition[] = [];

  @IsString()
  @IsOptional()
  queueName?: string;

  @IsString()
  contactFlowId!: string;

  @IsInstance(ScheduleExecutionState)
  @Type(() => ScheduleExecutionState)
  @ValidateNested()
  runState!: ScheduleExecutionState;

  @IsEnum(ScheduleExecutionStatus)
  status: ScheduleExecutionStatus = ScheduleExecutionStatus.RUNNING;

  @IsDate()
  @Type(() => Date)
  scheduleExecStartTime!: Date;

  @IsDate()
  @Type(() => Date)
  scheduleOccurrenceStartTime!: Date;

  @ValidateNested()
  @IsInstance(CampaignPacingDefinition)
  @Type(() => CampaignPacingDefinition)
  currentPacing!: Required<CampaignPacingDefinition>;

  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  statsFromTime!: Date;

  @IsString()
  @IsOptional()
  scheduleIANAZone?: string;

  @IsInt()
  globalMaxCPA!: number;

  static build(
    scheduleDefinition: ScheduleDefinition,
    campaign: CampaignDefinition,
    contactList: ContactListDefinition,
    filterData: ScheduleExecutionFilterDefinition[],
    queueName: string | undefined,
    contactFlowId: string,
    globalMaxCPA: number,
    scheduleExecStartTime: Date,
    scheduleOccurrenceStartTime: Date,
    scheduleOccurrenceEndTime: Date
  ) {
    const toReturn = new ScheduleExecutionDefinition();
    toReturn.schedule = scheduleDefinition;
    toReturn.campaign = campaign;
    toReturn.contactList = contactList;
    toReturn.filterData = filterData;
    toReturn.queueName = queueName;
    toReturn.contactFlowId = contactFlowId;
    toReturn.scheduleExecStartTime = scheduleExecStartTime;
    toReturn.statsFromTime = scheduleExecStartTime;
    toReturn.scheduleOccurrenceStartTime = scheduleOccurrenceStartTime;
    toReturn.scheduleIANAZone = scheduleDefinition.Occurrence.getTZID();
    toReturn.runState = new ScheduleExecutionState();
    toReturn.globalMaxCPA = globalMaxCPA;
    toReturn.currentPacing = toReturn.generatePacing();
    return toReturn;
  }

  public generatePacing(pacingOverride: Partial<CampaignPacingDefinition> = {}) {
    return plainToClass(
      CampaignPacingDefinition,
      _.mergeWith({}, { MaxCPA: this.globalMaxCPA }, this.campaign.Pacing, this.schedule.PacingOverride, pacingOverride)
    ) as Required<CampaignPacingDefinition>;
  }

  public getEntityIdArr() {
    return [this.schedule.id, this.campaign.id, this.id];
  }

  getNextSequence(): ScheduleSequenceDefinition | null {
    if (this.status === ScheduleExecutionStatus.STOPPING) {
      return null;
    }
    this.runState.currentSequenceIndex++;
    if (this.runState.currentSequenceIndex >= this.schedule.Sequences.length) {
      this.runState.currentSequenceIndex = 0;
      this.runState.currentSequenceLoop++;
    }
    if (this.runState.currentSequenceLoop >= this.schedule.Loops) {
      return null;
    }
    const toReturn = this.schedule.Sequences[this.runState.currentSequenceIndex];
    return toReturn;
  }

  getOccurrenceDate() {
    return getISODateString(this.scheduleOccurrenceStartTime, this.scheduleIANAZone);
  }

  shouldBeFinishedAt(date: Date) {
    return date.getTime() > this.scheduleOccurrenceStartTime.getTime() + this.schedule.Occurrence.getDurationMillis();
  }

  getEndTime() {
    return new Date(this.scheduleOccurrenceStartTime.getTime() + this.schedule.Occurrence.getDurationMillis());
  }

  getTimeUntilFinishedAt(time: number) {
    return this.getEndTime().getTime() - time;
  }

  generateExpireTimeSecondsAt(time: number) {
    return Math.floor(this.getTimeUntilFinishedAt(time) / 1000);
  }

  public getRelatedEntities() {
    return [
      {
        entityId: this.campaign.id,
        entityRelationship: ScheduleExecutionDefinition.CAMPAIGN_RELATIONSHIP,
        skipDependencyCheck: true,
      },
      {
        entityId: this.schedule.id,
        entityRelationship: ScheduleExecutionDefinition.SCHEDULE_RELATIONSHIP,
        skipDependencyCheck: true,
      },
    ];
  }

  static readonly CAMPAIGN_RELATIONSHIP = new EntityRelationship(
    ScheduleExecutionDefinition.ENTITY_TYPE,
    CampaignDefinition.ENTITY_TYPE,
    EntityRelationshipType.ONE_TO_ONE
  );
  static readonly SCHEDULE_RELATIONSHIP = new EntityRelationship(
    ScheduleExecutionDefinition.ENTITY_TYPE,
    ScheduleDefinition.ENTITY_TYPE,
    EntityRelationshipType.ONE_TO_ONE
  );

  static from(obj: object): ScheduleExecutionDefinition {
    return transformAndValidateSync(ScheduleExecutionDefinition, obj, defaultCRUDTransformValidationOptions);
  }
}
