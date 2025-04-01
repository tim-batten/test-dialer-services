import { classToPlain } from "class-transformer";
import { RedisHandler } from "./redis-handler";
import { RedisClientPool } from "./redis-client-pool";
import { GlobalConfigDefinition } from "lcme-common/lib/models/global-config";
import { ChainableCommander } from "ioredis";
import { RedisBackedCache } from "../utils/redis-backed-cache";

export class GlobalConfigDb extends RedisHandler {

    dbBaseName: string
    public readonly cache: RedisBackedCache<GlobalConfigDefinition>

    constructor(redisClientPool: RedisClientPool) {
        super(redisClientPool)
        this.dbBaseName = redisClientPool.makeBaseRedisKey(GlobalConfigDefinition.ENTITY_TYPE)
        this.cache = new RedisBackedCache<GlobalConfigDefinition>(60000, (pipeline) => this.get(pipeline))
    }

    public async get(pipeline?: ChainableCommander) {
        const entityObj = await this.jsonGetObject(this.dbBaseName, pipeline)
        if (!entityObj) {
            return
        }
        return GlobalConfigDefinition.from(entityObj)
    }

    public async set(entityDefinition: GlobalConfigDefinition, pipeline?: ChainableCommander) {
        await this.jsonSetObject(this.dbBaseName, classToPlain(entityDefinition), pipeline)
    }
}