import { transformAndValidateSync } from "class-transformer-validator"
import { IsOptional, IsString, ValidateNested, IsInt, IsInstance } from "class-validator"
import { Type } from "class-transformer";
import { defaultCRUDTransformValidationOptions } from "../utils/validation"
import { DbEntity, Transformable } from './db-entity';

export class CampaignComplianceDefinition {
    @IsInt()
    DailyCallLimitRecord!: number

    @IsInt()
    DailyCallLimitPhone!: number
}

export class ContactListDefinition extends Transformable implements DbEntity {
    static ENTITY_TYPE = 'contact_list'
    
    @IsOptional()
    @IsString()
    id!: string

    @IsString()
    ContactListConfigName!: string

    @IsString()
    ContactListTable!: string

    @IsString()
    PhoneListTable!: string

    @IsString()
    DncTable!: string

    @IsString()
    DncIdentifier!: string

    @IsString({
        each: true
    })
    PhoneTypes!: string[]

    @ValidateNested()
    @IsInstance(CampaignComplianceDefinition)
    @Type(() => CampaignComplianceDefinition)
    Compliance!: CampaignComplianceDefinition[];

    public getRelatedEntities() {
        return []
    }

    static from(contactListObj: object): ContactListDefinition {
        return transformAndValidateSync(ContactListDefinition, contactListObj, defaultCRUDTransformValidationOptions)
    }
}