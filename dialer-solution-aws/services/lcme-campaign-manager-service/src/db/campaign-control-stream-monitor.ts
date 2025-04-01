import chalk from 'chalk'
import { RedisClientPool } from "lcme-services-common/lib/db/redis-client-pool"
import { RedisStreamGroupEventMonitor } from "lcme-services-common/lib/db/redis-stream-event-monitor"
import { CampaignManager } from '../campaign-manager'
import { PauseCampaignEvent, ResumeCampaignEvent, StartCampaignEvent, StopCampaignEvent } from 'lcme-services-common/lib/events/campaign-control'
import { serviceConfig } from '../config/config'
import { Logger } from 'lcme-services-common/lib/logger/logger'

export class CampaignControlStreamMonitor extends RedisStreamGroupEventMonitor {
    campaignManager: CampaignManager

    constructor(redisClientPool: RedisClientPool, campaignManager: CampaignManager) {
        super(redisClientPool, 'campaign_control_stream', serviceConfig.campaignControlMonitor.consumerGroup)
        this.campaignManager = campaignManager
        this.addEventHandler(StartCampaignEvent.EVENT_NAME, this, this.handleStartCampaign)
        this.addEventHandler(StopCampaignEvent.EVENT_NAME, this, this.handleStopCampaign)
        this.addEventHandler(PauseCampaignEvent.EVENT_NAME, this, this.handlePauseCampaign)
        this.addEventHandler(ResumeCampaignEvent.EVENT_NAME, this, this.handleResumeCampaign)
    }

    private async handleStartCampaign(messageId: number, startCampaignData: StartCampaignEvent, receivedAt: Date) {
        const { campaignExecutionId } = startCampaignData
        this.logger.log('info', chalk.green(chalk.bold('Campaign Manager:'), 'Starting campaign exec ID', campaignExecutionId), { entityId: campaignExecutionId })
        this.campaignManager.startCampaign(campaignExecutionId)
    }

    private async handleStopCampaign(messageId: number, stopCampaignData: StopCampaignEvent, receivedAt: Date) {
        const { campaignExecutionId } = stopCampaignData
        this.logger.log('info', chalk.red(chalk.bold('Campaign Manager:'), 'Stopping campaign exec ID', campaignExecutionId), { entityId: campaignExecutionId })
        this.campaignManager.stopCampaign(stopCampaignData)
    }

    private async handlePauseCampaign(messageId: number, pauseCampaignData: StopCampaignEvent, receivedAt: Date) {
        const { campaignExecutionId } = pauseCampaignData
        this.logger.log('info', chalk.red(chalk.bold('Campaign Manager:'), 'Pausing campaign exec ID', campaignExecutionId), { entityId: campaignExecutionId })
        this.campaignManager.pauseCampaign(campaignExecutionId)
    }

    private async handleResumeCampaign(messageId: number, resumeCampaignData: StopCampaignEvent, receivedAt: Date) {
        const { campaignExecutionId } = resumeCampaignData
        this.logger.log('info', chalk.red(chalk.bold('Campaign Manager:'), 'Resuming campaign exec ID', campaignExecutionId), { entityId: campaignExecutionId })
        this.campaignManager.resumeCampaign(campaignExecutionId)
    }
}