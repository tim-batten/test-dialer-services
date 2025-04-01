import { RedisClientPool } from "lcme-services-common/lib/db/redis-client-pool"
import { CampaignExecutionDb } from "lcme-services-common/lib/db/campaign-execution-db"
import { RedisStreamGroupEventMonitor } from "lcme-services-common/lib/db/redis-stream-event-monitor"
import { CampaignExecutionCompleteEvent, CampaignExecutionStartedEvent } from 'lcme-services-common/lib/events/campaign-event'
import { QueueStatsManager } from "../stats-manager"
import { Logger } from 'lcme-services-common/lib/logger/logger'
import { serviceConfig } from "../config/config"

export class CampaignEventStreamMonitor extends RedisStreamGroupEventMonitor {
    queueStatsManager: QueueStatsManager
    campaignExecutionDb: CampaignExecutionDb

    //TODO: If we're going to have multiple stats services we need to either
    // 1. Have the campaign event monitor listen on the stream not as a group for the ended event 
    //    (so all stats services receive it) or
    // 2. Have the task queue stats manager store what it's monitoring in redis and have it poll that every 5s,
    //    rather than its own in memory structure

    constructor(redisClientPool: RedisClientPool, queueStatsManager: QueueStatsManager) {
        super(redisClientPool, 'campaign_event_stream', 'stats_campaign_event_group')
        this.campaignExecutionDb = new CampaignExecutionDb(redisClientPool)
        this.queueStatsManager = queueStatsManager
        this.addEventHandler(CampaignExecutionStartedEvent.EVENT_NAME, this, this.handleCampaignExecutionStarted)
    }

    private async handleCampaignExecutionStarted(messageId: number, campaignExecutionStartedData: CampaignExecutionStartedEvent, receivedAt: Date) {
        const campaignExecution = await this.campaignExecutionDb.get(campaignExecutionStartedData.campaignExecutionId)
        if (!campaignExecution) {
            return this.logger.log('info', 'Campaign execution not found, ignoring')
        }
        if (campaignExecution.shouldBeFinished()) {
            return this.logger.log('info', 'Campaign execution should be finished by now, ignoring')
        }
        if (campaignExecution.campaign.BaseConfig.CallingMode === 'agentless') {
            return this.logger.log('debug', 'Task queue stats not required for agentless campaign')
        }
        const queue = campaignExecution.campaign.BaseConfig.Queue
        const startDate = new Date(campaignExecution.executionStartTime)
        this.logger.mlog('info', ['Campaign execution', campaignExecution.id, 'STARTED - monitoring task queue', queue, 'from date', startDate])
        this.queueStatsManager.monitor(campaignExecution.id)
    }
}