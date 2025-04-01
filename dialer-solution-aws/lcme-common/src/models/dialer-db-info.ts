import { transformAndValidateSync } from "class-transformer-validator"
import { IsString } from "class-validator"
import { defaultCRUDTransformValidationOptions } from "../utils/validation"
import { Transformable } from './db-entity'

export class DialerDbInfoDefinition extends Transformable {

    @IsString()
    version!: string
    
    static from(dialerDbInfoObj: object): DialerDbInfoDefinition {
        return transformAndValidateSync(DialerDbInfoDefinition, dialerDbInfoObj, defaultCRUDTransformValidationOptions)
    }
}