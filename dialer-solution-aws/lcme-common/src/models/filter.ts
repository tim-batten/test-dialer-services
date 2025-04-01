import { transformAndValidateSync } from "class-transformer-validator"
import { defaultCRUDTransformValidationOptions } from "../utils/validation";
import {
    IsString,
    IsInt,
    IsIn
} from 'class-validator';
import { DbEntity, Transformable } from './db-entity';

export class FilterDefinition extends Transformable implements DbEntity {
    static ENTITY_TYPE = 'filter'

    @IsString()
    id: string = ''

    @IsString()
    tableCL: string = ''

    @IsString()
    filterSQL: string = ''

    @IsString()
    filterType: string = ''

    @IsString()
    filterName: string = ''

    @IsInt()
    filterID: number = 0

    @IsString()
    @IsIn(['filter', 'sort'])
    filterOrSort!: 'filter' | 'sort'

    public getRelatedEntities() {
        return []
    }

    static from(filterObj: object): FilterDefinition {
        return transformAndValidateSync(FilterDefinition, filterObj, defaultCRUDTransformValidationOptions)
    }
}
