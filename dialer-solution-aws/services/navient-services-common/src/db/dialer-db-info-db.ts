import { classToPlain } from "class-transformer"
import { DialerDbInfoDefinition } from "navient-common/lib/models/dialer-db-info"
import { RedisClientPool } from "./redis-client-pool"
import { RedisHandler } from "./redis-handler"

export class DialerDbInfoDb extends RedisHandler {
    dbBaseName: string

    constructor(redisClientPool: RedisClientPool) {
        super(redisClientPool)
        this.dbBaseName = redisClientPool.makeBaseRedisKey('dialer_db_info')
    }

    public async getVersion () {
        return this.redisClientPool.run((redisClient) => {
            return redisClient.hget(this.dbBaseName, 'version')
        })
    }

    public async setVersion(version: string) {
        return this.redisClientPool.run((redisClient) => {
            return redisClient.hset(this.dbBaseName, 'version', version)
        })
    }

    public async getVariant () {
        return this.redisClientPool.run((redisClient) => {
            return redisClient.hget(this.dbBaseName, 'variant')
        })
    }

    public async setVariant(variant: string) {
        return this.redisClientPool.run((redisClient) => {
            return redisClient.hset(this.dbBaseName, 'variant', variant)
        })
    }

}