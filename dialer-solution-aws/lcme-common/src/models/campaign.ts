import { Transform, Type } from "class-transformer";
import { transformAndValidateSync } from "class-transformer-validator";
import {
    IsIn, IsInstance, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, registerDecorator, Validate, ValidateIf, ValidateNested, validateSync, ValidationOptions
} from 'class-validator';
import { EntityRelationship } from "../db/entity-relationships";
import { AllGroupValidateOption, defaultCRUDTransformValidationOptions } from '../utils/validation';
import { CampaignGroupDefinition } from "./campaign-group";
import { ContactListDefinition } from "./contact-list";
import { DbEntity, EntityRelationshipType, Transformable } from './db-entity';

export const abaCalcModes = (<T extends string[]>(...o: T) => o)('Calls', 'Connects', 'Detects')
export type AbaCalculationMode = typeof abaCalcModes[number]

export const initialCpaModes = (<T extends string[]>(...o: T) => o)('duration', 'samples')
export type InitialCpaMode = typeof initialCpaModes[number]

export const CallingModes = ['power', 'agentless'] as const;
export type CallingMode = typeof CallingModes[number];

const POWER_GROUP = 'calling_mode_power';
const AGENTLESS_GROUP = 'calling_mode_agentless';
const PacingGroups = [POWER_GROUP, AGENTLESS_GROUP];
const CRUD_GROUP = 'crud';
const DB_GROUP = 'db';
const BaseGroups = [CRUD_GROUP, DB_GROUP];
const AllGroups = [...PacingGroups, ...BaseGroups]

export class CampaignBaseConfigDefinition {
  @IsIn(CallingModes, AllGroupValidateOption)
  CallingMode!: CallingMode;

  @IsString(AllGroupValidateOption)
  @IsNotEmpty(AllGroupValidateOption)
  Queue!: string;

  @IsString(AllGroupValidateOption)
  @IsNotEmpty(AllGroupValidateOption)
  ContactListConfigID!: string;

  @IsString(AllGroupValidateOption)
  @IsNotEmpty(AllGroupValidateOption)
  CampaignGroupId!: string;

  @IsString(AllGroupValidateOption)
  Callerid!: string;

  @IsString(AllGroupValidateOption)
  // CONNECT_TODO: Add validation for this?
  ContactFlowOverride?: string;

  @IsString({
    ...AllGroupValidateOption,
    each: true,
  })
  ActivePhoneTypes!: string[];

  @IsInt(AllGroupValidateOption)
  @Min(1, AllGroupValidateOption)
  @Max(100, AllGroupValidateOption)
  Weight!: number;
}

export class CampaignPacingDefinition extends Transformable {
  @IsOptional({ groups: [AGENTLESS_GROUP] })
  @IsInt({ groups: [POWER_GROUP] })
  InitialCPA!: number;

  @IsOptional({ groups: [AGENTLESS_GROUP] })
  @IsInt({ groups: [POWER_GROUP] })
  @Min(0, { groups: [POWER_GROUP] })
  InitialDuration!: number;

  @IsOptional({ groups: [AGENTLESS_GROUP] })
  @IsIn(initialCpaModes, { groups: [POWER_GROUP] })
  InitialCPAMode!: InitialCpaMode;

  @IsOptional({ groups: [AGENTLESS_GROUP] })
  @IsNumber({}, { groups: [POWER_GROUP] })
  @Min(0, { groups: [POWER_GROUP] })
  @Max(100, { groups: [POWER_GROUP] })
  AbaIncrement!: number;

  @IsOptional({ groups: [AGENTLESS_GROUP] })
  @IsNumber({}, { groups: [POWER_GROUP] })
  @Min(0, { groups: [POWER_GROUP] })
  @Max(100, { groups: [POWER_GROUP] })
  CpaModifier!: number;

  @IsOptional({ groups: [AGENTLESS_GROUP] })
  @IsIn(abaCalcModes, { groups: [POWER_GROUP] })
  AbaCalculation!: AbaCalculationMode;

  @IsOptional({ groups: [AGENTLESS_GROUP] })
  @IsInt({ groups: [POWER_GROUP] })
  @Min(0, { groups: [POWER_GROUP] })
  @Max(100, { groups: [POWER_GROUP] })
  AbaTargetRate!: number;

  @IsOptional({ groups: [POWER_GROUP] })
  @IsInt({ groups: [AGENTLESS_GROUP] })
  @Min(1, { groups: [AGENTLESS_GROUP] })
  ConcurrentCalls!: number;

  @IsOptional({ groups: [AGENTLESS_GROUP, POWER_GROUP] })
  @IsInt({ groups: [POWER_GROUP] })
  @Min(0, { groups: [POWER_GROUP] })
  MaxCPA?: number;

  static from(campaignPacingObj: object, callingMode: CallingMode): CampaignPacingDefinition {
    return transformAndValidateSync(CampaignPacingDefinition, campaignPacingObj, {
      transformer: {
        ...defaultCRUDTransformValidationOptions.transformer,
        groups: [`calling_mode_${callingMode}`],
      },
      validator: {
        ...defaultCRUDTransformValidationOptions.validator,
        groups: [`calling_mode_${callingMode}`],
      },
    });
  }
}

export class CampaignCustomAttribute {
  @IsString(AllGroupValidateOption)
  Name!: string;

  @IsString(AllGroupValidateOption)
  Value!: string;
}

export class CampaignCustomAttributesDefinition {

    @IsInstance(CampaignCustomAttribute, {
        ...AllGroupValidateOption,
        each: true
    })
    @Type(() => CampaignCustomAttribute)
    ActiveAttributes!: CampaignCustomAttribute[]
}

export class CampaignDefinition extends Transformable implements DbEntity {
  static ENTITY_TYPE = 'campaign';

  @IsOptional(AllGroupValidateOption)
  @IsString(AllGroupValidateOption)
  id: string = '';

  @IsString(AllGroupValidateOption)
  CampaignName!: string;

  @IsString(AllGroupValidateOption)
  @IsOptional({
    groups: [CRUD_GROUP, DB_GROUP],
  })
  ConnectCampaignId!: string;

  @ValidateNested(AllGroupValidateOption)
  @IsInstance(CampaignBaseConfigDefinition, AllGroupValidateOption)
  @Type(() => CampaignBaseConfigDefinition)
  BaseConfig!: CampaignBaseConfigDefinition;

  //   @ValidateNested(AllGroupValidateOption)
  @IsInstance(CampaignPacingDefinition, AllGroupValidateOption)
  @Type(() => CampaignPacingDefinition)
  @Transform(
    ({ value, obj }) => {
      return CampaignPacingDefinition.from(value, obj.BaseConfig ? obj.BaseConfig.CallingMode : undefined);
    },
    { toClassOnly: true, groups: AllGroups }
  )
  Pacing!: CampaignPacingDefinition;

  @ValidateNested(AllGroupValidateOption)
  @IsInstance(CampaignCustomAttributesDefinition, AllGroupValidateOption)
  @Type(() => CampaignCustomAttributesDefinition)
  CustomAttributes!: CampaignCustomAttributesDefinition;

  public getRelatedEntities() {
    return [
      {
        entityId: this.BaseConfig.ContactListConfigID,
        entityRelationship: CampaignDefinition.CONTACT_LIST_RELATIONSHIP,
      },
      {
        entityId: this.BaseConfig.CampaignGroupId,
        entityRelationship: CampaignDefinition.CAMPAIGN_GROUP_RELATIONSHIP,
      },
      {
        entityId: this.ConnectCampaignId,
        entityRelationship: CampaignDefinition.CONNECT_CAMPAIGN_RELATIONSHIP,
      }
    ];
  }

  static readonly CONTACT_LIST_RELATIONSHIP = new EntityRelationship(
    CampaignDefinition.ENTITY_TYPE,
    ContactListDefinition.ENTITY_TYPE,
    EntityRelationshipType.MANY_TO_ONE
  );
  static readonly CAMPAIGN_GROUP_RELATIONSHIP = new EntityRelationship(
    CampaignDefinition.ENTITY_TYPE,
    CampaignGroupDefinition.ENTITY_TYPE,
    EntityRelationshipType.MANY_TO_ONE
  );
  static readonly CONNECT_CAMPAIGN_RELATIONSHIP = new EntityRelationship(
    CampaignDefinition.ENTITY_TYPE,
    'connect_campaign',
    EntityRelationshipType.ONE_TO_ONE,
    {
      keyOnly: true,
    }
  );

  static dbFrom(campaignObj: object): CampaignDefinition {
    return transformAndValidateSync(CampaignDefinition, campaignObj, {
      transformer: {
        ...defaultCRUDTransformValidationOptions.transformer,
        groups: [DB_GROUP],
      },
      validator: {
        ...defaultCRUDTransformValidationOptions.validator,
        groups: [DB_GROUP],
      },
    });
  }

  static crudFrom(campaignObj: object): CampaignDefinition {
    return transformAndValidateSync(CampaignDefinition, campaignObj, {
      transformer: {
        ...defaultCRUDTransformValidationOptions.transformer,
        groups: [CRUD_GROUP],
      },
      validator: {
        ...defaultCRUDTransformValidationOptions.validator,
        groups: [CRUD_GROUP],
      },
    });
  }
}