import { RedisHandler } from "./redis-handler";
import { Redis } from "ioredis";
import { RedisClientPool } from "./redis-client-pool";
import { RedisStreamMessageListener } from "./redis-stream-message-listener";
import { Logger } from "../logger/logger";

export type GroupMonitorOptions = {
    autoAck?: boolean
}

export class RedisStreamGroupMonitor extends RedisHandler {
    streamName: string
    groupName: string
    streamEventListener: RedisStreamMessageListener
    consumerName: string = ''
    autoAck: boolean
    running: boolean

    constructor(redisClientPool: RedisClientPool, streamName: string, groupName: string, streamEventListener: RedisStreamMessageListener, options: GroupMonitorOptions = {}) {
        super(redisClientPool)
        const streamPrefix = redisClientPool.redisConf.streamPrefix
        this.streamName = redisClientPool.makeBaseRedisKey(streamPrefix ? streamPrefix + streamName : streamName)
        this.groupName = groupName
        this.streamEventListener = streamEventListener
        this.running = false
        this.autoAck = options.autoAck === false ? false : true
    }

    resultToItemListArray(result: any): any[] | undefined {
        if (result.length < 1) return
        const itemArray = result[0]
        if (itemArray.length < 2) return
        if (itemArray[0] !== this.streamName) {
            this.logger.log('error', `${itemArray[0]} is not ${this.streamName}`)
            return
        }
        const items = itemArray[1]
        if (items.length < 1) return
        const itemList: any[] = []
        items.forEach((item: any) => {
            const itemId = item[0]
            const itemValue = item[1]
            const itemMap = this.redisArrayToObjectUnflat(itemValue)
            itemList.push({
                itemId,
                value: itemMap
            })
        })
        return itemList
    }

    async start (consumerId: number | string | null = null) {
        this.logger.log('info', `Starting monitor for ${this.streamName} as group ${this.groupName}`)
        try {
            await this.redisClientPool.run((redisClient) => {
                return redisClient.xgroup('CREATE', this.streamName, this.groupName, '$', 'MKSTREAM')
            })
        } catch (e: any) {
            const eStr: string = e.toString()
            if (eStr.includes("Consumer Group name already exists")) {
                this.logger.log('info', `Consumer group ${this.groupName} for stream ${this.streamName} not created as it already exists`)
            } else {
                this.logger.log('error', e)
            }
        }
        this.running = true
        if (!consumerId || consumerId < 0) {
            consumerId = await this.redisClientPool.run((redisClient) => {
                return redisClient.incr(`${this.groupName}_consumer:id`)
            })
            this.logger.log('info', `Generated consumer id: ${consumerId}`)
        }
        this.consumerName = this.groupName + '_consumer:' + consumerId
        const redisClient = await this.redisClientPool.generateClient()
        while (this.running) {
            const result = await redisClient.xreadgroup("GROUP", this.groupName, this.consumerName, "COUNT", 50, "BLOCK", 30000, "STREAMS", this.streamName, '>')
            this.handleResult(result)
        }
    }

    handleResult(result: any) {
        const receivedAt = new Date()
        if (result) {
            const itemList = this.resultToItemListArray(result)
            if (!itemList) return
            itemList.forEach((item) => {
                if (this.autoAck) {
                    this.ack(item.itemId)
                }
                this.streamEventListener.handleStreamMessage(item.itemId, item.value, receivedAt)
            })

        }
    }

    ack(itemId: string | number) {
        return this.redisClientPool.run((redisClient) => {
            return redisClient.xack(this.streamName, this.groupName, itemId)
        })
    }
}