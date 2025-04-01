import { RedisClientPool } from "../db/redis-client-pool";
import Redis from 'ioredis'
import { RedisHandler } from "./redis-handler";

export class RedisChannelSubscriber {
    subscriberClient: any

    constructor(serviceConfigDb: any) {
        this.subscriberClient = new Redis(serviceConfigDb)
    }

    public async subscribeToChannel(channelName: string, subscribedHandler: Function, messageHandler: Function) {
        const subscribeResponse = await this.subscriberClient.subscribe(channelName, subscribedHandler);
        this.subscriberClient.on("message", messageHandler);
        return subscribeResponse
    }
}
