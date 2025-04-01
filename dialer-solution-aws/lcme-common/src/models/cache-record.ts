import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator"
import { DateTime, IANAZone } from "luxon"
import { ensureIANAZone } from "../utils/date-helper"
import { Transformable } from './db-entity'

export class CacheRecord extends Transformable {
    @IsInt()
    cache_ID!: number
    
    @IsInt()
    eventActions_ID!: number

    @IsInt()
    CL_identity!: number

    @IsInt()
    PND_identity!: number

    @IsString()
    CL_platformID!: string

    @IsString()
    phoneNumber!: string

    @IsBoolean()
    statusTCPA!: boolean

    @IsOptional()
    @IsString()
    Warning!: string

    @IsOptional()
    @IsString()
    CL_caller_id?: string

    @IsString()
    latestAllowableServerTime!: string
}

export function getRecordLatestAllowableTime(cacheRecord: CacheRecord, timezone: IANAZone | string | undefined) {
    return DateTime.fromISO(cacheRecord.latestAllowableServerTime, {
        zone: ensureIANAZone(timezone)
    }).toJSDate()
}