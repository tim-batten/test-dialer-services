import { Exclude, Transform, Type } from "class-transformer";
import { transformAndValidateSync } from "class-transformer-validator";
import {
    IsBoolean, IsDate, IsEnum, IsInstance, IsInt, IsISO8601, IsNumber, IsOptional, IsString, Max, Min, ValidateIf, ValidateNested
} from 'class-validator';
import { IANAZone } from "luxon";
import { IncompatibleWith } from '../validation/incompatiblewith';
import { Frequency, RRuleSet, RRule } from "rrule";
import { EntityRelationship } from "../db/entity-relationships";
import { getRRuleUTCStartDate, makeRDate, makeRuleSet, RecurrenceDateExclusion, RRuleHelper, RRuleHelperOptions } from "../utils/rrule-helper";
import { defaultCRUDTransformValidationOptions } from "../utils/validation";
import { RRuleMaxFrequency } from "../validation/rrule-validation";
import { CampaignDefinition, CampaignPacingDefinition } from "./campaign";
import { FilterDefinition } from "./filter";
import { LogEntity } from '../types/logger';
import { DbEntity, EntityRelationshipType, Transformable } from './db-entity';

export enum ConnectionAction {
    HANG_UP = 'HANG_UP',
    PASS_TO_CONTACT_FLOW = 'PASS_TO_CONTACT_FLOW',
    PASS_TO_AGENT = 'PASS_TO_AGENT'
}

export type TimesBetweenReturn = {
    start: Date
    end: Date
    disabled?: boolean
    disablingEntityId?: string
    disablingEntityName?: string
    disabledReason?: string
}

export enum OrderByType {
    ASC = 'ASC',
    DESC = 'DESC'
}

export class SequenceBasicConfigDefinition {
  @IsBoolean()
  AmDetection!: boolean;

  @ValidateIf((sequence) => sequence.AmDetection === true)
  @IsEnum(ConnectionAction)
  MachineDetectedBehavior!: ConnectionAction;

  @IsEnum(ConnectionAction)
  ConnectBehavior!: ConnectionAction;

  @ValidateIf((sequence) => sequence.MachineDetectedBehavior === 'PASS_TO_CONTACT_FLOW' && sequence.AmDetection)
  @IsString()
  MachineDetectedContactFlow!: string;

  @ValidateIf((sequence) => sequence.ConnectBehavior === 'PASS_TO_CONTACT_FLOW')
  @IsString()
  DefaultContactFlow!: string;

  @IsString({
    each: true,
  })
  Phones!: string[];
}

export class ScheduleFilterDefinition {
    @IsString()
    FilterID!: string
}

export class ScheduleSortDefinition {
    @IsString()
    OrderByID!: string

    @IsEnum(OrderByType)
    OrderByType!: OrderByType
}

export class ScheduleFilterSortDefinition {
    @IsOptional()
    @ValidateNested()
    @IsInstance(ScheduleFilterDefinition, {
        each: true
    })
    @Type(() => ScheduleFilterDefinition)
    ClFilters: ScheduleFilterDefinition[] = []

    @IsOptional()
    @ValidateNested()
    @IsInstance(ScheduleFilterDefinition, {
        each: true
    })
    @Type(() => ScheduleFilterDefinition)
    PndFilters: ScheduleFilterDefinition[] = []

    @IsOptional()
    @ValidateNested()
    @IsInstance(ScheduleSortDefinition, {
        each: true
    })
    @Type(() => ScheduleSortDefinition)
    ClSorts: ScheduleSortDefinition[] = []
}

export class SequencePacingDefinition {
    @IsBoolean()
    ClearStats!: boolean

    // Seems odd doing this but it was the only way I could get partial pacing definition to work
    // - had no luck with validation groups
    @Type(() => CampaignPacingDefinition)
    @Transform(({ value }) => transformAndValidateSync(CampaignPacingDefinition, value, {
        transformer: defaultCRUDTransformValidationOptions.transformer,
        validator: {
            ...defaultCRUDTransformValidationOptions.validator,
            skipMissingProperties: true
        }
    }), { toClassOnly: true })
    @IsOptional()
    PacingOverride: Partial<CampaignPacingDefinition> = {}
}

export class ScheduleSequenceDefinition {
    @IsString()
    SequenceName!: string;

    @ValidateNested()
    @IsInstance(SequenceBasicConfigDefinition)
    @Type(() => SequenceBasicConfigDefinition)
    BasicConfig!: SequenceBasicConfigDefinition;

    @ValidateNested()
    @IsInstance(ScheduleFilterSortDefinition)
    @Type(() => ScheduleFilterSortDefinition)
    FilterSort!: ScheduleFilterSortDefinition;

    @ValidateNested()
    @IsOptional()
    @IsInstance(SequencePacingDefinition)
    @Type(() => SequencePacingDefinition)
    Pacing?: SequencePacingDefinition

    isClearPacingStats() {
        return this.Pacing ? this.Pacing.ClearStats : false
    }
}

interface ScheduleOccurrence {
    getRuleSet(additionalExclusions: RecurrenceDateExclusion[]): RRuleSet
    getTZID(): string | undefined
    getStartDate(): Date
}

export class ScheduleOccurrenceSingle implements ScheduleOccurrence {
    @IsDate()
    @Type(() => Date)
    Date!: Date

    @IsString()
    @IsOptional()
    Parent?: String

    getStartDate(): Date {
        return this.Date
    }

    getTZID(): string | undefined {
        return
    }

    getRuleSet(additionalExclusions: RecurrenceDateExclusion[]) {
        const toReturn = new RRuleSet()
        toReturn.rdate(this.Date)
        return toReturn
    }
}

export class ScheduleOccurrenceExclusionInfo {
    @IsISO8601()
    Date!: string

    @IsString()
    @IsOptional()
    OccurrenceId?: string
}

export class ScheduleOccurrenceRecurring implements ScheduleOccurrence {
    @Type(() => String)
    @IsInstance(RRule)
    @RRuleMaxFrequency(Frequency.DAILY)
    @Transform(({ value }) => {
        const parsed = RRule.parseString(value)
        if (parsed.tzid) {
            if (!IANAZone.isValidZone(parsed.tzid)) {
                throw new Error(`Invalid IANA Timezone "${parsed.tzid}" supplied in RRule: ${value}`)
            }
        }
        return new RRule(parsed)
    }, { toClassOnly: true })
    @Transform(({ value }) => value.toString(), { toPlainOnly: true })
    RRule!: RRule;

    @ValidateNested()
    @IsInstance(ScheduleOccurrenceExclusionInfo, {
        each: true
    })
    @Type(() => ScheduleOccurrenceExclusionInfo)
    Exclusions: ScheduleOccurrenceExclusionInfo[] = []

    @IsISO8601({}, {
        each: true
    })
    DisabledDates: string[] = []

    getRuleSet(additionalExclusions: RecurrenceDateExclusion[]) {
        const toReturn = new RRuleSet()
        toReturn.rrule(this.RRule)
        this.Exclusions.forEach((exclusion) => {
            toReturn.exdate(makeRDate(exclusion.Date, this.RRule.options.dtstart))
        })
        this.DisabledDates.forEach((disabledDate) => {
            toReturn.exdate(makeRDate(disabledDate, this.RRule.options.dtstart))
        })
        additionalExclusions.forEach((exclusion) => {
            toReturn.exdate(makeRDate(exclusion.isoDate, this.RRule.options.dtstart))
        })
        return toReturn
    }

    getDisabledRuleSet() {
        return makeRuleSet(this.RRule.options.tzid, this.RRule.options.dtstart, this.DisabledDates)
    }

    setOccurrenceDisabledState(disabled: boolean, toSet: string) {
        if (disabled) {
            if (this.DisabledDates.includes(toSet)) {
                return `Occurrence ${toSet} already disabled`
            }
            this.DisabledDates.push(toSet)
        } else {
            let found = false
            this.DisabledDates = this.DisabledDates.filter(disabledDate => {
                if (disabledDate === toSet) {
                    found = true
                    return false
                }
                return true
            })
            if (!found) {
                return `Occurrence ${toSet} isn't disabled - can't enable`
            }
        }
    }

    getTZID(): string | undefined {
        return this.RRule.options.tzid || undefined
    }

    getStartDate(): Date {
        return getRRuleUTCStartDate(this.RRule)
    }
}

export class ScheduleOccurrenceDefinition {
    @ValidateNested()
    @IsInstance(ScheduleOccurrenceSingle)
    @Type(() => ScheduleOccurrenceSingle)
    @IncompatibleWith(['Recurring'])
    @ValidateIf(obj => (!obj.Single && !obj.Recurring) || obj.Single)
    Single?: ScheduleOccurrenceSingle

    @ValidateNested()
    @IsInstance(ScheduleOccurrenceRecurring)
    @Type(() => ScheduleOccurrenceRecurring)
    @IncompatibleWith(['Single'])
    @ValidateIf(obj => (!obj.Single && !obj.Recurring) || obj.Recurring)
    Recurring?: ScheduleOccurrenceRecurring

    @IsInt()
    @Min(1)
    @Max(1439)
    Duration!: number;

    getDurationMillis() {
        return this.Duration * 60000
    }

    getOccurrence(): ScheduleOccurrence {
        return this.Single ? this.Single : this.Recurring!
    }

    getRuleSet(additionalExclusions: RecurrenceDateExclusion[]) {
        return this.getOccurrence().getRuleSet(additionalExclusions)
    }

    getTZID() {
        return this.getOccurrence().getTZID()
    }
}

export type TimesBetweenOptions = RRuleHelperOptions | {
    includeDisabled: boolean
}

export class ScheduleDefinition extends Transformable implements DbEntity, LogEntity {
  static ENTITY_TYPE = 'schedule';

  @IsOptional()
  @IsString()
  id: string = '';

  @IsString()
  ScheduleName!: string;

  // Seems odd doing this but it was the only way I could get partial pacing definition to work
  // - had no luck with validation groups
  @Type(() => CampaignPacingDefinition)
  @Transform(
    ({ value }) =>
      transformAndValidateSync(CampaignPacingDefinition, value, {
        transformer: defaultCRUDTransformValidationOptions.transformer,
        validator: {
          ...defaultCRUDTransformValidationOptions.validator,
          skipMissingProperties: true,
        },
      }),
    { toClassOnly: true }
  )
  @IsOptional()
  PacingOverride: Partial<CampaignPacingDefinition> = {};

  @IsBoolean()
  Disabled: boolean = false;

  @Type(() => ScheduleOccurrenceDefinition)
  @IsInstance(ScheduleOccurrenceDefinition)
  @ValidateNested()
  Occurrence!: ScheduleOccurrenceDefinition;

  @IsString()
  CampaignId!: string;

  @IsNumber()
  Loops!: number;

  @ValidateNested()
  @IsInstance(ScheduleSequenceDefinition, {
    each: true,
  })
  @Type(() => ScheduleSequenceDefinition)
  Sequences!: ScheduleSequenceDefinition[];

  @Exclude()
  public getRuleSet(additionalExclusions: RecurrenceDateExclusion[]) {
    return this.Occurrence.getRuleSet(additionalExclusions);
  }

  @Exclude()
  public getTimesBetween(
    start: Date,
    end: Date,
    additionalExclusions: RecurrenceDateExclusion[],
    options: Partial<RRuleHelperOptions> = {},
    includeDisabled = true
  ) {
    if (!includeDisabled && this.Disabled) {
      return [];
    }
    let toReturn = RRuleHelper.betweenTZ(this.Occurrence.getRuleSet(additionalExclusions), start, end, options).map(
      (date) => {
        return {
          start: date,
          end: new Date(date.getTime() + this.Occurrence.getDurationMillis()),
          disabled: this.Disabled ? true : undefined,
        };
      }
    ) as TimesBetweenReturn[];
    if (includeDisabled) {
      if (this.Occurrence.Recurring) {
        const disabledTimes = RRuleHelper.betweenTZ(
          this.Occurrence.Recurring.getDisabledRuleSet(),
          start,
          end,
          options
        ).map((date) => {
          return {
            start: date,
            end: new Date(date.getTime() + this.Occurrence.getDurationMillis()),
            disabled: true,
            disabledReason: 'disabled',
          };
        });
        let additionalExclusionsTimes: TimesBetweenReturn[] = [];
        if (additionalExclusions) {
          const baseRuleset = this.Occurrence.getRuleSet([]);
          const baseRRuleDates = new Set<number>(
            RRuleHelper.betweenTZ(baseRuleset, start, end, options).map((date) => date.getTime())
          );
          const rrule = this.Occurrence.Recurring.RRule;
          additionalExclusions.forEach((exclusion) => {
            const timeBetween = RRuleHelper.betweenTZ(
              makeRuleSet(rrule.options.tzid, rrule.options.dtstart, [exclusion.isoDate]),
              start,
              end,
              options
            );
            if (timeBetween.length === 0) {
              return;
            }
            const date = timeBetween[0];
            if (!baseRRuleDates.has(date.getTime())) {
              return;
            }
            additionalExclusionsTimes.push({
              start: date,
              end: new Date(timeBetween[0].getTime() + this.Occurrence.getDurationMillis()),
              disabled: true,
              disabledReason: exclusion.reason,
              disablingEntityId: exclusion.id,
              disablingEntityName: exclusion.name,
            });
          });
        }
        toReturn = toReturn
          .concat(disabledTimes, additionalExclusionsTimes)
          .sort((d1, d2) => d1.start.getTime() - d2.start.getTime());
      }
    }
    return toReturn;
  }

  @Exclude()
  public getNextTimeAfter(
    datetime: Date,
    additionalExclusions: RecurrenceDateExclusion[],
    options: Partial<RRuleHelperOptions> = {}
  ) {
    const date = RRuleHelper.afterTZ(this.getRuleSet(additionalExclusions), datetime, options);
    if (!date) {
      return undefined;
    }
    return {
      start: date,
      end: new Date(date.getTime() + this.Occurrence.getDurationMillis()),
    };
  }

  @Exclude()
  private getLastTimeBefore(
    datetime: Date,
    additionalExclusions: RecurrenceDateExclusion[],
    options?: Partial<RRuleHelperOptions>
  ) {
    const date = RRuleHelper.beforeTZ(this.getRuleSet(additionalExclusions), datetime, options);
    if (!date) {
      return undefined;
    }
    return {
      start: date,
      end: new Date(date.getTime() + this.Occurrence.getDurationMillis()),
    };
  }

  @Exclude()
  public isRunningAt(datetime: Date, additionalExclusions: RecurrenceDateExclusion[]) {
    return this.getRunningTimeAt(datetime, additionalExclusions) ? true : false;
  }

  @Exclude()
  public getRunningTimeAt(datetime: Date, additionalExclusions: RecurrenceDateExclusion[]) {
    if (this.Disabled) {
      return false;
    }
    const lastTimeBefore = this.getLastTimeBefore(datetime, additionalExclusions);
    if (!lastTimeBefore) {
      return false;
    }
    if (lastTimeBefore.end.getTime() < datetime.getTime()) {
      return false;
    }
    return lastTimeBefore;
  }

  public setDisabled(disabled: boolean, occurrenceDate?: string) {
    if (this.Occurrence.Single) {
      if (this.Disabled === disabled) {
        return `Can't disable an already disabled schedule`;
      }
      this.Disabled = disabled;
    } else if (this.Occurrence.Recurring) {
      if (occurrenceDate) {
        return this.Occurrence.Recurring.setOccurrenceDisabledState(disabled, occurrenceDate);
      } else {
        if (this.Disabled === disabled) {
          return `Can't disable an already disabled schedule`;
        }
        this.Disabled = disabled;
      }
    }
  }

  getEntityIdArr(): string[] {
    return [this.id, this.CampaignId];
  }

  public getAllFilterIds() {
    const filterDeps = new Set<string>();
    this.Sequences.forEach((sequence) => {
      sequence.FilterSort.ClFilters.forEach((clFilter) => {
        filterDeps.add(clFilter.FilterID);
      });
      sequence.FilterSort.ClSorts.forEach((clSort) => {
        filterDeps.add(clSort.OrderByID);
      });
      sequence.FilterSort.PndFilters.forEach((pndFilter) => {
        filterDeps.add(pndFilter.FilterID);
      });
    });
    return [...filterDeps];
  }

  public getRelatedEntities() {
    return [
      {
        entityId: this.CampaignId,
        entityRelationship: ScheduleDefinition.CAMPAIGN_RELATIONSHIP,
      },
      ...this.getAllFilterIds().map((id) => {
        return {
          entityId: id,
          entityRelationship: ScheduleDefinition.FILTER_RELATIONSHIP,
        };
      }),
    ];
  }

  static readonly CAMPAIGN_RELATIONSHIP = new EntityRelationship(
    ScheduleDefinition.ENTITY_TYPE,
    CampaignDefinition.ENTITY_TYPE,
    EntityRelationshipType.MANY_TO_ONE
  );
  static readonly FILTER_RELATIONSHIP = new EntityRelationship(
    ScheduleDefinition.ENTITY_TYPE,
    FilterDefinition.ENTITY_TYPE,
    EntityRelationshipType.MANY_TO_MANY
  );

  static from(scheduleObj: object): ScheduleDefinition {
    return transformAndValidateSync(ScheduleDefinition, scheduleObj, defaultCRUDTransformValidationOptions);
  }
}