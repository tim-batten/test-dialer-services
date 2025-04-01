import chalk from 'chalk'

import { RedisClientPool } from "lcme-services-common/lib/db/redis-client-pool"
import { RedisStreamGroupEventMonitor } from "lcme-services-common/lib/db/redis-stream-event-monitor"
import { QueueManager } from "../queue-manager"
import { StartQueueEvent, StopQueueEvent } from 'lcme-services-common/lib/events/queue-control'
import { serviceConfig } from '../config/config'

export class QueueControlStreamMonitor extends RedisStreamGroupEventMonitor {
    queueManager: QueueManager

    constructor(redisClientPool: RedisClientPool, queueManager: QueueManager) {
        super(redisClientPool, 'queue_control_stream', serviceConfig.queueControlMonitor.consumerGroup)
        this.queueManager = queueManager
        this.addEventHandler(StartQueueEvent.EVENT_NAME, this, this.handleStartQueue)
        this.addEventHandler(StopQueueEvent.EVENT_NAME, this, this.handleStopQueue)
    }

    private async handleStartQueue(messageId: number, startQueueData: StartQueueEvent, receivedAt: Date) {
        const { cacheEventActionsId, cachedRecords, campaignExecutionId } = startQueueData
        this.logger.log('info', chalk.green(chalk.bold('Queue Monitor'), 'Starting queue with campaign exec ID', campaignExecutionId, 'at', new Date()))
        this.queueManager.startQueue(campaignExecutionId)
    }

    private async handleStopQueue(messageId: number, stopQueueData: StopQueueEvent, receivedAt: Date) {
        const { campaignExecutionId } = stopQueueData
        this.logger.log('info', chalk.green(chalk.bold('Queue Monitor'), 'Stopping queue with campaign exec ID', campaignExecutionId, 'at', new Date()))
        this.queueManager.stopQueue(campaignExecutionId)
    }
}