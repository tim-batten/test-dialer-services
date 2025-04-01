import { Transform, Type } from "class-transformer";
import { transformAndValidateSync } from "class-transformer-validator";
import {
    IsBoolean, IsEnum, IsInstance, IsInt, IsNumber, IsOptional, IsString, ValidateNested
} from 'class-validator';
import { EntityRelationship } from "../db/entity-relationships";
import { defaultCRUDTransformValidationOptions } from "../utils/validation";
import { CampaignDefinition, CampaignPacingDefinition } from "./campaign";
import { ContactListDefinition } from "./contact-list";
import { ConnectionAction, OrderByType, ScheduleDefinition, ScheduleSequenceDefinition } from "./schedule";
import { ScheduleExecutionDefinition, ScheduleExecutionFilterDefinition } from "./schedule-execution";
import { DbEntity, EntityRelationshipType, Transformable } from './db-entity';
import { LogEntity } from '../types/logger';

export enum CampaignExecutionStatus {
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  STOPPING = 'STOPPING',
}

export class CampaignExecutionFilterDefinition {
    @IsString()
    id!: string

    @IsInt()
    filterId!: number

    @IsString()
    filterName!: string

    static from(filterDefinition: ScheduleExecutionFilterDefinition) {
        const toReturn = new CampaignExecutionFilterDefinition()
        toReturn.id = filterDefinition.id
        toReturn.filterId = filterDefinition.filterId
        toReturn.filterName = filterDefinition.filterName
        return toReturn
    }
}

export class CampaignExecutionSortDefinition {
    @IsString()
    id!: string

    @IsString()
    orderByName!: string

    @IsInt()
    orderById!: number

    @IsEnum(OrderByType)
    orderByType!: OrderByType

    static from(filterDefinition: ScheduleExecutionFilterDefinition, orderByType: OrderByType) {
        const toReturn = new CampaignExecutionSortDefinition()
        toReturn.id = filterDefinition.id
        toReturn.orderByName = filterDefinition.filterName
        toReturn.orderById = filterDefinition.filterId
        toReturn.orderByType = orderByType
        return toReturn
    }
}

export class CampaignExecutionDefinition extends Transformable implements DbEntity, LogEntity {
  static ENTITY_TYPE = 'campaign_execution';

  @IsString()
  id: string = '';

  @IsString()
  scheduleExecutionId!: string;

  @IsString()
  scheduleId!: string;

  @IsEnum(CampaignExecutionStatus)
  status: CampaignExecutionStatus = CampaignExecutionStatus.STARTING;

  @IsOptional()
  @IsInt()
  cacheEventActionsId?: number;

  @IsOptional()
  @Type(() => Date)
  @IsInstance(Date)
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  executionStartTime!: Date;

  @IsOptional()
  @Type(() => Date)
  @IsInstance(Date)
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  statsFromTime!: Date;

  @Type(() => Date)
  @IsInstance(Date)
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  scheduleExecStartTime!: Date;

  @Type(() => Date)
  @IsInstance(Date)
  @IsOptional()
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  lastDialTime?: Date;

  @IsOptional()
  @IsInt()
  scheduleDuration!: number;

  @Type(() => Date)
  @IsInstance(Date)
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @Transform(({ value }) => value.getTime(), { toPlainOnly: true })
  scheduleOccurrenceStartTime!: Date;

  @IsString()
  @IsOptional()
  scheduleIANAZone?: string;

  @IsString()
  contactFlowId!: string;

  @IsInt()
  @IsOptional()
  recordsToDial!: number;

  @IsInt()
  @IsOptional()
  recordsAttempted: number = 0;

  @IsNumber()
  @IsOptional()
  lastPacingCalculationResult: number = 0;

  @IsNumber()
  @IsOptional()
  lastAbandonRate: number = 0;

  @IsNumber()
  @IsOptional()
  lastCPA: number = 0;

  @IsBoolean()
  allRecordsRequested: boolean = false;

  @IsBoolean()
  finalised: boolean = false;

  @IsBoolean()
  clearStats!: boolean;

  @IsBoolean()
  amDetection!: boolean;

  @IsString()
  livePartyBehavior!: ConnectionAction;

  @IsString()
  @IsOptional()
  livePartyContactFlow?: string;

  @IsString()
  answeringMachineBehavior!: ConnectionAction;

  @IsString()
  @IsOptional()
  answeringMachineContactFlow?: string;

  @IsString({
    each: true,
  })
  phones!: string[];

  @IsOptional()
  @ValidateNested()
  @IsInstance(CampaignExecutionFilterDefinition, {
    each: true,
  })
  @Type(() => CampaignExecutionFilterDefinition)
  filters!: CampaignExecutionFilterDefinition[];

  @IsOptional()
  @ValidateNested()
  @IsInstance(CampaignExecutionSortDefinition, {
    each: true,
  })
  @Type(() => CampaignExecutionSortDefinition)
  sorts!: CampaignExecutionSortDefinition[];

  @IsNumber()
  sequenceIndex!: number;

  @IsNumber()
  sequenceLoop!: number;

  @IsInstance(CampaignDefinition)
  @Type(() => CampaignDefinition)
  campaign!: CampaignDefinition;

  @ValidateNested()
  @IsInstance(CampaignPacingDefinition)
  @Type(() => CampaignPacingDefinition)
  currentPacing!: Required<CampaignPacingDefinition>;

  @IsInstance(ContactListDefinition)
  @Type(() => ContactListDefinition)
  contactList!: ContactListDefinition;

  @IsBoolean()
  hasReceivedPostback: boolean = false;

  @IsBoolean()
  cacheReleased: boolean = false;

  static build(
    scheduleExecution: ScheduleExecutionDefinition,
    sequence: ScheduleSequenceDefinition,
    clFilters: CampaignExecutionFilterDefinition[],
    pndFilters: CampaignExecutionFilterDefinition[],
    clSorts: CampaignExecutionSortDefinition[],
    clearStats: boolean
  ) {
    const toReturn = new CampaignExecutionDefinition();
    toReturn.scheduleExecutionId = scheduleExecution.id;
    toReturn.scheduleId = scheduleExecution.schedule.id;
    toReturn.scheduleDuration = scheduleExecution.schedule.Occurrence.Duration;

    toReturn.scheduleExecStartTime = scheduleExecution.scheduleExecStartTime;
    toReturn.statsFromTime = scheduleExecution.statsFromTime;
    toReturn.scheduleOccurrenceStartTime = scheduleExecution.scheduleOccurrenceStartTime;
    toReturn.scheduleIANAZone = scheduleExecution.scheduleIANAZone;
    toReturn.contactFlowId = scheduleExecution.contactFlowId;
    toReturn.clearStats = clearStats;
    toReturn.amDetection = sequence.BasicConfig.AmDetection ? true : false;
    toReturn.livePartyBehavior = sequence.BasicConfig.ConnectBehavior;
    toReturn.livePartyContactFlow = sequence.BasicConfig.DefaultContactFlow;
    toReturn.answeringMachineBehavior = sequence.BasicConfig.MachineDetectedBehavior;
    toReturn.answeringMachineContactFlow = sequence.BasicConfig.MachineDetectedContactFlow;

    toReturn.sequenceIndex = scheduleExecution.runState.currentSequenceIndex;
    toReturn.sequenceLoop = scheduleExecution.runState.currentSequenceLoop;

    toReturn.phones = sequence.BasicConfig.Phones;

    toReturn.filters = [...clFilters, ...pndFilters];
    toReturn.sorts = clSorts;

    toReturn.campaign = scheduleExecution.campaign;
    toReturn.currentPacing = scheduleExecution.currentPacing;
    toReturn.contactList = scheduleExecution.contactList;
    return toReturn;
  }

  public getEntityIdArr() {
    return [this.scheduleId, this.campaign.id, this.scheduleExecutionId, this.id];
  }

  public getEndByDate() {
    return new Date(this.scheduleOccurrenceStartTime.getTime() + this.getDurationMillis());
  }

  getDurationMillis() {
    return this.scheduleDuration * 60000;
  }

  public shouldBeFinished() {
    return this.shouldBeFinishedAt(new Date());
  }

  public shouldBeFinishedAt(date: Date) {
    return date.getTime() > this.getEndByDate().getTime();
  }

  getTimeUntilFinishedAt(date: Date) {
    return this.getEndByDate().getTime() - date.getTime();
  }

  generateExpireTimeSecondsAt(date: Date) {
    return Math.floor(this.getTimeUntilFinishedAt(date) / 1000);
  }

  public getRelatedEntities() {
    return [
      {
        entityId: this.campaign.id,
        entityRelationship: CampaignExecutionDefinition.CAMPAIGN_RELATIONSHIP,
        skipDependencyCheck: true,
      },
      {
        entityId: this.scheduleId,
        entityRelationship: CampaignExecutionDefinition.SCHEDULE_RELATIONSHIP,
        skipDependencyCheck: true,
      },
      {
        entityId: this.scheduleExecutionId,
        entityRelationship: CampaignExecutionDefinition.SCHEDULE_EXECUTION_RELATIONSHIP,
        skipDependencyCheck: true,
      },
      {
        entityId: this.campaign.ConnectCampaignId,
        entityRelationship: CampaignExecutionDefinition.CONNECT_CAMPAIGN_RELATIONSHIP,
        skipDependencyCheck: true,
      },
    ];
  }

  static readonly CAMPAIGN_RELATIONSHIP = new EntityRelationship(
    CampaignExecutionDefinition.ENTITY_TYPE,
    CampaignDefinition.ENTITY_TYPE,
    EntityRelationshipType.ONE_TO_ONE
  );
  static readonly SCHEDULE_RELATIONSHIP = new EntityRelationship(
    CampaignExecutionDefinition.ENTITY_TYPE,
    ScheduleDefinition.ENTITY_TYPE,
    EntityRelationshipType.MANY_TO_ONE
  );
  static readonly SCHEDULE_EXECUTION_RELATIONSHIP = new EntityRelationship(
    CampaignExecutionDefinition.ENTITY_TYPE,
    ScheduleExecutionDefinition.ENTITY_TYPE,
    EntityRelationshipType.MANY_TO_ONE
  );
  static readonly CONNECT_CAMPAIGN_RELATIONSHIP = new EntityRelationship(
    CampaignExecutionDefinition.ENTITY_TYPE,
    'connect_campaign',
    EntityRelationshipType.ONE_TO_ONE,
    {
      keyOnly: true,
    }
  );

  static from(obj: object): CampaignExecutionDefinition {
    return transformAndValidateSync(CampaignExecutionDefinition, obj, defaultCRUDTransformValidationOptions);
  }
}
