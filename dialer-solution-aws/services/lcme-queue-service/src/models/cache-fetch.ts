import { Type } from "class-transformer"
import { IsInstance } from "class-validator"
import { CacheRecord } from "lcme-common/lib/models/cache-record"

export class CacheFetchRequest {
    readonly CRUD_Action = "subProcedure"
    readonly procedureAction = "cache"
    readonly appID = "WTI_queueSvc"

    appNameID: number
    cacheAmount: number
    cache_eventActions_ID: number
    nonConsent_Records: 0 | 1

    constructor(appNameID: number, cacheAmount: number, cache_eventActions_ID: number, nonConsent_Records: boolean) {
        this.appNameID = appNameID
        this.cacheAmount = cacheAmount
        this.cache_eventActions_ID = cache_eventActions_ID
        this.nonConsent_Records = nonConsent_Records === true ? 1 : 0
    }
}

export class CacheFetchResponseData {
    @IsInstance(CacheRecord, {
        each: true
    })
    @Type(() => CacheRecord)
    returnData!: CacheRecord[];

    public getWarning() {
        const warningObj = this.returnData.filter((rd) => rd.Warning)[0]
        if (warningObj) {
            return warningObj.Warning
        }
        return undefined
    }
}