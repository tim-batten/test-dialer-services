import { CampaignConfigDb } from 'navient-services-common/lib/db/campaign-config-db'
import { CampaignControlStreamMonitor } from './db/campaign-control-stream-monitor';
import { RedisClientPool } from 'navient-services-common/lib/db/redis-client-pool';
import { CampaignExecutionDb } from "navient-services-common/lib/db/campaign-execution-db"
import { CampaignExecutionDefinition, CampaignExecutionStatus } from 'navient-common/lib/models/campaign-execution';
import { CacheBuildPostback } from './models/cache-build';
import { CacheManager } from './cache-manager';
import { QueueControlStreamPublisher } from './db/queue-control-stream-publisher';
import { QueueEventStreamMonitor } from './db/queue-event-stream-monitor';
import { CampaignEventStreamPublisher } from './db/campaign-event-stream-publisher';
import { serviceConfig } from './config/config';
import { Logger } from 'navient-services-common/lib/logger/logger'
import { StopCampaignEvent } from 'navient-services-common/lib/events/campaign-control';
import { ServiceManager } from 'navient-services-common/lib/utils/service-manager';
import { clearStatsForCampaignExecution } from "navient-services-common/lib/utils/campaign-stats-helper"
import { PacingStatsDb } from 'navient-services-common/lib/db/pacing-stats-db';
import { ContactInfoDb } from 'navient-services-common/lib/db/contact-info-db';

export class CampaignManager {
    protected readonly logger: Logger = Logger.getLogger()
    redisClientPool: RedisClientPool
    cacheManager: CacheManager
    campaignDb: CampaignConfigDb
    campaignControlMonitor: CampaignControlStreamMonitor
    campaignExecutionDb: CampaignExecutionDb
    contactInfoDb: ContactInfoDb
    statsDb: PacingStatsDb
    queueControlStream: QueueControlStreamPublisher
    queueEventMonitor: QueueEventStreamMonitor
    campaignEventStream: CampaignEventStreamPublisher
    serviceManager: ServiceManager = ServiceManager.getInstance()

    constructor(redisClientPool: RedisClientPool) {
        this.redisClientPool = redisClientPool
        this.cacheManager = new CacheManager(this)
        this.campaignDb = new CampaignConfigDb(redisClientPool)
        this.campaignControlMonitor = new CampaignControlStreamMonitor(redisClientPool, this)
        this.campaignExecutionDb = new CampaignExecutionDb(redisClientPool)
        this.contactInfoDb = new ContactInfoDb(redisClientPool);
        this.statsDb = new PacingStatsDb(redisClientPool)
        this.queueControlStream = new QueueControlStreamPublisher(redisClientPool)
        this.queueEventMonitor = new QueueEventStreamMonitor(redisClientPool, this)
        this.campaignEventStream = new CampaignEventStreamPublisher(redisClientPool)
    }

    async start() { 
        this.campaignControlMonitor.start(serviceConfig.campaignControlMonitor.consumerId)
        this.queueEventMonitor.start(serviceConfig.queueEventMonitor.consumerId)
    }

    async startCampaign(campaignExecutionId: string) {
        this.logger.log('info', `Starting campaign exec id ${campaignExecutionId}`,
            { entityId: [ campaignExecutionId ] })
        try {
            const campaignExecutionDefinition = await this.campaignExecutionDb.get(campaignExecutionId)
            if (!campaignExecutionDefinition) {
                throw new Error('No campaign execution definition for exec id ' + campaignExecutionId)
            }
            if (campaignExecutionDefinition.shouldBeFinished()) {
                this.logger.log('info', `Campaign exec ${campaignExecutionId} should be finished, not executing`, { entity: campaignExecutionDefinition })
                await this.campaignEventStream.campaignExecutionComplete(campaignExecutionId)
                await this.campaignEventStream.campaignExecutionFinalised(campaignExecutionId)
                return
            }
            //TODO: Mark campaign as active
            await this.campaignEventStream.campaignExecutionStarting(campaignExecutionId)
            await this.cacheManager.buildCache(campaignExecutionDefinition)
        } catch (e: any) {
            this.logger.log('info', e)
            await this.campaignEventStream.campaignExecutionFailed(campaignExecutionId, e.message ? e.message : e.toString())
        }

    }

    async releaseCache(campaignExecution: CampaignExecutionDefinition) {
        try {
            if (campaignExecution.cacheReleased) {
                this.logger.log('verbose', `Not releasing cache for ${campaignExecution.id} as it has already been released`, { entity: campaignExecution })
                return
            }
            const released = await this.cacheManager.releaseCache(campaignExecution)
            if (released) {
                await this.campaignExecutionDb.setCacheReleased(campaignExecution).catch((e) => {
                    this.logger.mlog('info', 
                        ["Could not update campaign execution to cache released", e],
                        { entity: campaignExecution })
                })
            }
        } catch (e) {
            this.logger.log('error', [ "Unexepcted failure releasing cache", e ], {
                entity: campaignExecution
            })
        }

    }

    async campaignExecutionFailed(campaignExecution: CampaignExecutionDefinition, reason: string) {
        this.logger.log('info', 'campaign execution failed: ' + reason, { entity: campaignExecution })
        await this.releaseCache(campaignExecution)
        this.campaignEventStream.campaignExecutionFailed(campaignExecution.id, reason)
    }

    async campaignExecutionIdFailed(campaignExecutionId: string, reason: string) {
        this.logger.log('info', 'campaign execution failed: ' + reason, { entityId: campaignExecutionId })
        const campaignExecution = await this.campaignExecutionDb.get(campaignExecutionId)
        if (campaignExecution) {
            await this.releaseCache(campaignExecution)
        }
        this.campaignEventStream.campaignExecutionFailed(campaignExecutionId, reason)

    }

    async stopCampaign(stopCampaignInfo: StopCampaignEvent) {
        const { campaignExecutionId, immediateReleaseCache } = stopCampaignInfo
        const [ campaignExecution, worker, ] = await this.redisClientPool.runForcePipeline((pipeline) => Promise.all([
            this.campaignExecutionDb.get(campaignExecutionId, pipeline),
            this.serviceManager.jobManager.jobDb.getWorkerForJob(campaignExecutionId, pipeline),
            this.campaignExecutionDb.updateStatus(campaignExecutionId, CampaignExecutionStatus.STOPPING, pipeline).catch((e) => {})
        ]))
        if (!campaignExecution) {
            return
        }
        if (!campaignExecution.hasReceivedPostback || !worker) {
            this.campaignExecutionComplete(campaignExecution)
            this.campaignExecutionIdFinalised(campaignExecutionId)
            return
        }
        if (immediateReleaseCache) {
            await this.releaseCache(campaignExecution)
        }
    }
    async pauseCampaign(campaignExecutionId: string) {
        this.logger.log('info', `Pausing campaign execution ${campaignExecutionId}`, { entityId: campaignExecutionId })
        this.campaignExecutionDb.updateStatus(campaignExecutionId, CampaignExecutionStatus.PAUSED)
    }
    async resumeCampaign(campaignExecutionId: string) {
        this.logger.log('info', `Resuming campaign execution ${campaignExecutionId}`, { entityId: campaignExecutionId })
        this.campaignExecutionDb.updateStatus(campaignExecutionId, CampaignExecutionStatus.RUNNING)
    }

    async readyToQueue(cacheBuildResponse: CacheBuildPostback, campaignExecutionInfo: CampaignExecutionDefinition) {
        this.logger.log('info', 'Cache build complete, sending to queue service', { entity: campaignExecutionInfo })
        const now = new Date()
        if (campaignExecutionInfo.clearStats) {
            this.logger.log('info', 'Clearing pacing stats', { entity: campaignExecutionInfo })
            await clearStatsForCampaignExecution(campaignExecutionInfo, this.campaignExecutionDb)
        }
        await this.campaignExecutionDb.setStartInfo(campaignExecutionInfo, now, cacheBuildResponse.data.timeWindow_callableRecords)
        this.campaignEventStream.campaignExecutionStarted(campaignExecutionInfo.id)
        this.queueControlStream.startQueue(cacheBuildResponse.data.cache_eventActions_ID, 
                                cacheBuildResponse.data.timeWindow_callableRecords, 
                                campaignExecutionInfo.id)
    }

    async campaignExecutionComplete(campaignExecution: CampaignExecutionDefinition) {
        await this.releaseCache(campaignExecution)
        this.campaignEventStream.campaignExecutionComplete(campaignExecution.id)
    }

    async campaignExecutionIdComplete(campaignExecutionId: string) {
        const campaignExecution = await this.campaignExecutionDb.get(campaignExecutionId)
        if (campaignExecution) {
            await this.releaseCache(campaignExecution)
        }
        this.campaignEventStream.campaignExecutionComplete(campaignExecutionId)
    }

    async campaignExecutionIdFinalised(campaignExecutionId: string) {
        this.campaignEventStream.campaignExecutionFinalised(campaignExecutionId)
    }

    async campaignExecutionIdExpired(campaignExecutionId: string) {
        await this.campaignExecutionDb.updateStatus(campaignExecutionId, CampaignExecutionStatus.STOPPING)
        const campaignExecution = await this.campaignExecutionDb.get(campaignExecutionId)
        if (campaignExecution) {
            this.releaseCache(campaignExecution)
        }
    }
}