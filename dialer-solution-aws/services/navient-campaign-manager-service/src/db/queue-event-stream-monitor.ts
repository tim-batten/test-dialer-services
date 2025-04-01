import chalk from 'chalk'
import { RedisClientPool } from "navient-services-common/lib/db/redis-client-pool"
import { RedisStreamGroupEventMonitor } from 'navient-services-common/lib/db/redis-stream-event-monitor'
import { CampaignManager } from '../campaign-manager'
import { QueueCompleteEvent, QueueExpiredEvent, QueueFailedEvent, QueueFinalisedEvent } from 'navient-services-common/lib/events/queue-event'
import { Logger } from 'navient-services-common/lib/logger/logger'
import { serviceConfig } from "../config/config"

export class QueueEventStreamMonitor extends RedisStreamGroupEventMonitor {
    campaignManager: CampaignManager

    constructor(redisClientPool: RedisClientPool, campaignManager: CampaignManager) {
        super(redisClientPool, 'queue_event_stream', 'campaign_queue_event_group')
        this.campaignManager = campaignManager
        this.addEventHandler(QueueCompleteEvent.EVENT_NAME, this, this.handleQueueComplete)
        this.addEventHandler(QueueFinalisedEvent.EVENT_NAME, this, this.handleQueueFinalised)
        this.addEventHandler(QueueExpiredEvent.EVENT_NAME, this, this.handleQueueExpired)
        this.addEventHandler(QueueFailedEvent.EVENT_NAME, this, this.handleQueueFailed)
    }

    private async handleQueueComplete(timestamp: number, queueCompleteData: QueueCompleteEvent) {
        const { campaignExecutionId } = queueCompleteData
        this.logger.log('info', chalk.green(chalk.bold('Queue event monitor:'), 'Queue has finished queueing records', campaignExecutionId), { entityId: campaignExecutionId })
        this.campaignManager.campaignExecutionIdComplete(campaignExecutionId)
    }

    private async handleQueueFinalised(timestamp: number, queueFinalisedData: QueueFinalisedEvent) {
        const { campaignExecutionId } = queueFinalisedData
        this.logger.log('info', chalk.green(chalk.bold('Queue event monitor:'), 'Queue has finished all processing', campaignExecutionId), { entityId: campaignExecutionId })
        this.campaignManager.campaignExecutionIdFinalised(campaignExecutionId)
    }

    private async handleQueueExpired(timestamp: number, queueExpiredData: QueueExpiredEvent) {
        const { campaignExecutionId } = queueExpiredData
        this.logger.log('info', chalk.green(chalk.bold('Queue event monitor:'), 'Queue has finished - expired', campaignExecutionId), { entityId: campaignExecutionId })
        this.campaignManager.campaignExecutionIdExpired(campaignExecutionId)
    }

    private async handleQueueFailed(timestamp: number, queueFailedData: QueueFailedEvent) {
        const { campaignExecutionId, reason } = queueFailedData
        this.logger.log('info', `chalk.green(${chalk.bold('Queue event monitor:')} Queue has finished - failed for campaign execution ${campaignExecutionId} with reason ${reason}`, { entityId: campaignExecutionId })
        this.campaignManager.campaignExecutionIdFailed(campaignExecutionId, reason)
    }
}