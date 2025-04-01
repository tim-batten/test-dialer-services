import { plainToClass } from "class-transformer"
import { IsString } from "class-validator"

export class HostConfig {
    @IsString()
    hostname: string = 'localhost'

    static from(plain: object) {
        return plainToClass(HostConfig, plain)
    }
}
