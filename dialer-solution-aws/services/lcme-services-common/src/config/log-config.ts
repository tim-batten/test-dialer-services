import { transformAndValidateSync } from "class-transformer-validator";
import { IsIn, IsObject, IsOptional, IsString } from "class-validator";
import { LoggerLevel, logLevels } from "../logger/logger";

export class LogConfig {
    @IsString()
    @IsOptional()
    logFile?: '';

    @IsObject()
    @IsOptional()
    logMetadata?: {} = {}

    @IsIn(logLevels)
    @IsOptional()
    logLevel: LoggerLevel =  'debug'

    static from(plain: object) {
        return transformAndValidateSync(LogConfig, plain)
    }
}
