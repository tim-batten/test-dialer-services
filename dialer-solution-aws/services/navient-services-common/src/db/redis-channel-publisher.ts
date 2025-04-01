import { RedisHandler } from "./redis-handler";
import { RedisClientPool } from "./redis-client-pool";
import { ChainableCommander } from "ioredis";

export class RedisChannelPublisher extends RedisHandler {
    channelName: string

    constructor(redisClientPool: RedisClientPool, channelName: string) {
        super(redisClientPool)
        this.channelName = redisClientPool.makeBaseRedisKey(channelName)
    }

    public async publishToChannel(data: any, pipeline?: ChainableCommander) {
        const publishResponse = await this.redisClientPool.runP(async (redisClient) => {
            const publishResponse = await redisClient.publish(this.channelName, JSON.stringify(data))
            return publishResponse
        }, pipeline)
        return publishResponse
    }
}