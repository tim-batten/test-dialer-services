import { Type } from "class-transformer"
import { IsBoolean, IsInstance, IsInt, IsOptional, IsString } from "class-validator"

export class CacheReleaseRequest {
    readonly CRUD_Action = "subProcedure"
    readonly procedureAction = "release"
    readonly appID = "WTI_queueSvc"

    appNameID: number
    cache_eventActions_ID: number

    constructor(appNameID: number, cache_eventActions_ID: number) {
        this.appNameID = appNameID
        this.cache_eventActions_ID = cache_eventActions_ID
    }
}

export class CacheReleaseReturnData {
    @IsInt()
    @IsOptional()
    totalReleased?: number
}

export class CacheReleaseData {
    @IsInstance(CacheReleaseReturnData, {
        each: true
    })
    @Type(() => CacheReleaseReturnData)
    @IsOptional()
    returnData?: CacheReleaseReturnData[]
}

export class CacheReleaseResponse {
    @IsBoolean()
    isSuccess!: boolean

    @IsString()
    statusMessage!: string

    @IsInstance(CacheReleaseData)
    @Type(() => CacheReleaseReturnData)
    data!: CacheReleaseData
}