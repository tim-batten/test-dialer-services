import chalk from 'chalk'
import { RedisClientPool } from "lcme-services-common/lib/db/redis-client-pool"
import { RedisStreamGroupEventMonitor } from "lcme-services-common/lib/db/redis-stream-event-monitor"
import { ScheduleExecutionManager } from '../schedule-execution-manager'
import { CampaignExecutionCompleteEvent, CampaignExecutionFailedEvent, CampaignExecutionFinalisedEvent } from 'lcme-services-common/lib/events/campaign-event'
import { Logger } from 'lcme-services-common/lib/logger/logger'
import { serviceConfig } from "../config/config"

export class CampaignEventStreamMonitor extends RedisStreamGroupEventMonitor {
    scheduleExecutionManager: ScheduleExecutionManager

    constructor(redisClientPool: RedisClientPool, scheduleExecutionManager: ScheduleExecutionManager) {
        super(redisClientPool, 'campaign_event_stream', 'schedule_campaign_event_group')
        this.scheduleExecutionManager = scheduleExecutionManager
        this.addEventHandler(CampaignExecutionCompleteEvent.EVENT_NAME, this, this.handleCampaignExecutionComplete)
        this.addEventHandler(CampaignExecutionFailedEvent.EVENT_NAME, this, this.handleCampaignExecutionFailed)
        this.addEventHandler(CampaignExecutionFinalisedEvent.EVENT_NAME, this, this.handleCampaignExecutionFinalised)
    }

    private async handleCampaignExecutionComplete(messageId: number, campaignExecutionCompleteData: CampaignExecutionCompleteEvent, receivedAt: Date) {
        const { campaignExecutionId } = campaignExecutionCompleteData
        this.logger.log('verbose', chalk.green(chalk.bold('Schedule event monitor:'), 'Campaign has finished executing', campaignExecutionId, 'at', new Date()))
        this.scheduleExecutionManager.campaignExecutionComplete(campaignExecutionId)
    }

    private async handleCampaignExecutionFinalised(messageId: number, campaignExecutionCompleteData: CampaignExecutionCompleteEvent, receivedAt: Date) {
        const { campaignExecutionId } = campaignExecutionCompleteData
        this.logger.log('verbose', chalk.green(chalk.bold('Schedule event monitor:'), 'Campaign has finalised and is now safe to remove', campaignExecutionId, 'at', new Date()))
        this.scheduleExecutionManager.campaignExecutionFinalised(campaignExecutionId)
    }

    private async handleCampaignExecutionFailed(messageId: number, campaignExecutionFailedData: CampaignExecutionFailedEvent, receivedAt: Date) {
        const { campaignExecutionId, reason } = campaignExecutionFailedData
        this.logger.log('info', chalk.red(chalk.bold('Schedule event monitor:'), 'Campaign execution', campaignExecutionId, 'failed with reason', reason, 'at', new Date()))
        this.scheduleExecutionManager.campaignExecutionComplete(campaignExecutionId, true)
        this.scheduleExecutionManager.campaignExecutionFinalised(campaignExecutionId)
    }
}