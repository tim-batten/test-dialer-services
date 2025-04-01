import { transformAndValidateSync } from "class-transformer-validator"
import { IsOptional, IsString } from "class-validator"
import { defaultCRUDTransformValidationOptions } from "../utils/validation"
import { DbEntity, Transformable } from './db-entity'

export class CampaignGroupDefinition extends Transformable implements DbEntity {
    static ENTITY_TYPE = 'campaign_group'

    @IsOptional()
    @IsString()
    id!: string

    @IsString()
    name!: string

    getRelatedEntities() {
        return []
    }

    static from(groupObj: object): CampaignGroupDefinition {
        return transformAndValidateSync(CampaignGroupDefinition, groupObj, defaultCRUDTransformValidationOptions)
    }
}