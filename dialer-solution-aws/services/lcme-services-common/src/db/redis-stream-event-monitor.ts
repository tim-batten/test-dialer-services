import { Logger } from '../logger/logger'
import { RedisClientPool } from './redis-client-pool'
import { GroupMonitorOptions, RedisStreamGroupMonitor } from './redis-stream-group-monitor'
import { RedisStreamMessageListener } from './redis-stream-message-listener'

type eventHandlerFunction = (messageId: number, event: any, receivedAt: Date) => void

export abstract class RedisStreamEventMonitor implements RedisStreamMessageListener {
    protected readonly logger: Logger = Logger.getLogger()
    private eventHandlers: {[eventName: string]: eventHandlerFunction} = {}

    protected addEventHandler(eventName: string, bindTo: RedisStreamEventMonitor, eventHandler: eventHandlerFunction) {
        this.eventHandlers[eventName] = eventHandler.bind(bindTo)
    }

    handleStreamMessage(messageId: number, streamMessage: any, receivedAt: Date): void {
        const event = streamMessage.event
        if (!event) {
            this.logger.log('error', `Received stream message with no event on stream ${this.getStreamName()}`)
            return
        }
        const eventHandler = this.eventHandlers[streamMessage.event]
        if (!eventHandler) {
            //this.logger.log('error', `Received unexpected event ${event} with message ID ${messageId} on stream ${this.getStreamName()}`)
            return
        }
        eventHandler(messageId, streamMessage, receivedAt)
    }

    abstract getStreamName(): string
    
}

export class RedisStreamGroupEventMonitor extends RedisStreamEventMonitor {
    redisStreamGroupMonitor: RedisStreamGroupMonitor

    constructor(redisClientPool: RedisClientPool, streamName: string, groupName: string, options: GroupMonitorOptions = {}) {
        super()
        this.redisStreamGroupMonitor = new RedisStreamGroupMonitor(redisClientPool, streamName, groupName, this, options)
    }

    start(consumerId: number | string | null = null) {
        this.redisStreamGroupMonitor.start(consumerId)
    }

    getStreamName(): string {
        return this.redisStreamGroupMonitor.streamName
    }

}