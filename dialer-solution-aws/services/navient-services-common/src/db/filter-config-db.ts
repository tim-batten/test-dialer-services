import { classToPlain } from "class-transformer";
import { RedisHandler } from "./redis-handler";
import { FilterDefinition } from "navient-common/lib/models/filter";
import { RedisGenericJsonEntityDb } from "./redis-generic-json-entity-db";
import { RedisClientPool } from "./redis-client-pool";

export class FilterConfigDb extends RedisGenericJsonEntityDb<FilterDefinition> {
    constructor(redisClientPool: RedisClientPool) {
        super(redisClientPool, FilterDefinition.ENTITY_TYPE, FilterDefinition.from)
    }
}