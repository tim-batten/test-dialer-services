import { ScheduleDefinition } from "navient-common/lib/models/schedule";
import { RedisGenericJsonEntityDb } from "./redis-generic-json-entity-db";
import { RedisClientPool } from "./redis-client-pool";

export class ScheduleConfigDb extends RedisGenericJsonEntityDb<ScheduleDefinition> {
    constructor(redisClientPool: RedisClientPool) {
        super(redisClientPool, ScheduleDefinition.ENTITY_TYPE, ScheduleDefinition.from)
    }
}