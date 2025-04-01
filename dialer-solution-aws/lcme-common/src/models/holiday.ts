import { IsBoolean, IsOptional, IsString, Validate } from "class-validator"
import { transformAndValidateSync } from "class-transformer-validator"
import { defaultCRUDTransformValidationOptions } from "../utils/validation"
import { IsValidISODateStringContraint } from "../validation/time-validation"
import { makeRuleSet, RecurrenceDateExclusion } from "../utils/rrule-helper"
import { DbEntity, Transformable } from './db-entity'

export class HolidayDefinition extends Transformable implements DbEntity {
    @IsOptional()
    @IsString()
    id!: string

    @IsString()
    @Validate(IsValidISODateStringContraint)
    Date!: string

    @IsString()
    HolidayName!: string

    @IsBoolean()
    RepeatAnnually: boolean = false

    getEntityRelationships() {
        return []
    }

    makeRuleSet(tzid: string) {
        return makeRuleSet(tzid, '00:00:00', [this.Date])
    }

    toRecurrenceDateExclusion(): RecurrenceDateExclusion {
        return {
            id: this.id,
            name: this.HolidayName,
            reason: 'holiday',
            data: this,
            isoDate: this.Date
        }
    }

    getRelatedEntities() {
        return []
    }

    static from(contactListObj: object): HolidayDefinition {
        return transformAndValidateSync(HolidayDefinition, contactListObj, defaultCRUDTransformValidationOptions)
    }
}