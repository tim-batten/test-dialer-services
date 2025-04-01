import { RedisClientPool } from "./redis-client-pool";

export class RedisSetDb {
    redisClientPool: RedisClientPool
    dbBaseName: string

    constructor(redisClientPool: RedisClientPool, dbBaseName: string) {
        this.redisClientPool = redisClientPool
        this.dbBaseName = redisClientPool.makeBaseRedisKey(dbBaseName)
    }

    add(key: string, value: string) {
        return this.redisClientPool.run((redisClient) => {
            return redisClient.sadd(`${this.dbBaseName}:${key}`, value)
        })
    }

    async members(key: string) {
        return this.redisClientPool.run((redisClient) => {
            return redisClient.smembers(`${this.dbBaseName}:${key}`)
        })
    }

    async count(key: string) {
        return this.redisClientPool.run((redisClient) => {
            return redisClient.scard(`${this.dbBaseName}:${key}`)
        })
    }

    async remove(key: string, value: string) {
        const numRemoved = await this.redisClientPool.run((redisClient) => {
            return redisClient.srem(`${this.dbBaseName}:${key}`, value)
        })
        return numRemoved === 1 ? true : false
    }

    async addAndGetCount(key: string, value: string) {
        const count: number = await this.redisClientPool.run(async(redisClient) => {
            const pipeline = redisClient.pipeline()
            pipeline.sadd(`${this.dbBaseName}:${key}`, value)
            const scardPromise = this.redisClientPool.scard(`${this.dbBaseName}:${key}`, pipeline)
            pipeline.exec()
            return await scardPromise
        })
        return count
    }

    async removeAndGetCount(key: string, value: string) {
        const count: number = await this.redisClientPool.run(async(redisClient) => {
            const pipeline = redisClient.pipeline()
            pipeline.srem(`${this.dbBaseName}:${key}`, value)
            const scardPromise = this.redisClientPool.scard(`${this.dbBaseName}:${key}`, pipeline)
            pipeline.exec()
            return await scardPromise
        })
        return count
    }
}