import { plainToClass } from "class-transformer"
import { IsInt, IsOptional, IsString} from "class-validator"

export class CrudApiConfig {
    @IsString()
    crudApiUrl!: string

    @IsString()
    crudApiTimezone: string = 'America/New_York'

    @IsInt()
    @IsOptional()
    appNameId: number = 4

    static from(plain: object) {
        return plainToClass(CrudApiConfig, plain)
    }
}
