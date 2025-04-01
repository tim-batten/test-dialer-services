import { RedisGenericJsonEntityDb } from "./redis-generic-json-entity-db";
import { RedisClientPool } from "./redis-client-pool";
import { HolidayDefinition } from "lcme-common/lib/models/holiday";
import { RRuleSet } from "rrule";
import { RecurrenceDateExclusion, RRuleHelper, RRuleHelperOptions } from 'lcme-common/lib/utils/rrule-helper';
import { GlobalConfigDb } from "./global-config-db";
import { ChainableCommander } from "ioredis";

const oneDay = 1000 * 60 * 60 * 24

export class HolidayDb extends RedisGenericJsonEntityDb<HolidayDefinition> {
    private globalConfigDb: GlobalConfigDb
    constructor(redisClientPool: RedisClientPool) {
        super(redisClientPool, 'holiday', HolidayDefinition.from)
        this.globalConfigDb = new GlobalConfigDb(redisClientPool)
    }

    async getAllTimesBetween(start: Date, end: Date, options: Partial<RRuleHelperOptions> = {}, pipeline?: ChainableCommander) {
        const [ global, allHolidays ] = await this.redisClientPool.runForcePipeline((pipeline) => {
            return Promise.all([
                this.globalConfigDb.get(pipeline),
                this.getAllAsList(pipeline)
            ])
        }, pipeline)
        const globalTimezone = global!.DialerDefaults.ScheduleTimezone
        const holidayBetweenInfos = allHolidays.map((holiday) => {
            const ruleset = holiday.makeRuleSet(globalTimezone)
            return {
                holiday,
                times: RRuleHelper.betweenTZ(ruleset, start, end, options).map((time) => {
                    return {
                        start: time,
                        //TODO: This should maybe factor in timezone rather than adding 24h
                        end: new Date(time.getTime() + oneDay)
                    }
                }),
                ruleset
            }
        })
        return holidayBetweenInfos.filter((holidayBetweenInfo) => holidayBetweenInfo.times.length > 0)
    }
    
    async getAllAsRecurrenceDateExclusions(pipeline?: ChainableCommander): Promise<RecurrenceDateExclusion[]> {
        const allHolidays = await this.getAllAsList(pipeline)
        return allHolidays.map((holiday) => holiday.toRecurrenceDateExclusion())
    }

}