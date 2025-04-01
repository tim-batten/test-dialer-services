import { RedisClientPool } from "./redis-client-pool";

import { CampaignExecutionDefinition } from "navient-common/lib/models/campaign-execution";
import { CacheRecord } from "navient-common/lib/models/cache-record";
import { ChainableCommander } from "ioredis";

export interface WorkQueueData {
    campaignExecutionId: string,
    workId: number, //Not used by anything, just ensures uniqueness in the set (unfortunately no sorted list in redis, just sorted set)
    endBy: number,
    queuedAt: Date
}

export type WorkQueueDataWithScore = {
    workData: WorkQueueData,
    score: number
}

export type ExecutableRecord = {
    campaignExecutionId: string,
    workScore: number,
    executionEndBy: number,
    cacheRecord: CacheRecord | null
}

export class QueueDb {
    //TODO: Come up with better key names
    prioritisedWorkQueueKey: string
    campaignExecutionRecordQueueBaseKey: string

    constructor(private readonly redisClientPool: RedisClientPool) {
        this.prioritisedWorkQueueKey = `${redisClientPool.makeBaseRedisKey('queue')}:prioritised_work_queue`
        this.campaignExecutionRecordQueueBaseKey = `${redisClientPool.makeBaseRedisKey('queue')}:campaign_exec_work_queue`
    }

    makeScore(weight: number) {
        return Math.random() * weight
    }

    queueRecord(workId: number, campaignExecution: CampaignExecutionDefinition, cacheRecord: CacheRecord) {
        return this.queueRecords(workId, campaignExecution, [cacheRecord])
    }

    queueRecords(workIdBase: number, campaignExecution: CampaignExecutionDefinition, cacheRecords: CacheRecord[]) {
        if (cacheRecords.length === 0) {
            return
        }
        const campaignExecutionRecordQueueKey = this.makeCampaignExecRecordQueueKey(campaignExecution.id)
        const queuedAt = new Date()
        const endBy = campaignExecution.getEndByDate().getTime()
        const queueDatas = cacheRecords.map((cacheRecord, index) => {
            const score = this.makeScore(campaignExecution.campaign.BaseConfig.Weight)
            const workQueueData: WorkQueueData = {
                workId: workIdBase + index,
                campaignExecutionId: campaignExecution.id,
                endBy,
                queuedAt
            }
            return {
                score,
                workQueueDataStr: JSON.stringify(workQueueData),
                cacheRecordStr: JSON.stringify(cacheRecord.toPlain())
            }
        })
        return this.redisClientPool.run((redisClient) => {
            const pipeline = this.redisClientPool.getMultiOrPipeline(redisClient, true)
            queueDatas.forEach((queueData) => {
                pipeline.zadd(this.prioritisedWorkQueueKey, queueData.score, queueData.workQueueDataStr)
                pipeline.rpush(campaignExecutionRecordQueueKey, queueData.cacheRecordStr)
            })
            return pipeline.exec()
        })
    }

    async deleteRecordList(campaignExecutionId: string, pipeline?: ChainableCommander) {
        const key = this.makeCampaignExecRecordQueueKey(campaignExecutionId)
        return this.redisClientPool.del(key, pipeline)
    }

    async dequeueWork(maxRecordsToPull: number) {
        const result: string[] = await this.redisClientPool.run((redisClient) => {
            return redisClient.zpopmax(this.prioritisedWorkQueueKey, maxRecordsToPull)
        })
        const toReturn: WorkQueueDataWithScore[] = []
        result.forEach((value, idx) => {
            if (idx % 2 === 0) {
                toReturn.push({
                    workData: JSON.parse(value),
                    score: parseFloat(result[idx+1])
                })
            }
        })
        return toReturn
    }

    async dequeueRecords(maxRecordsToPull: number): Promise<ExecutableRecord[]> {
        const workList = await this.dequeueWork(maxRecordsToPull)
        if (workList.length === 0) {
            return []
        }
        //TODO: May change this to LMOVE to put into a "working queue" in case QS goes down before all outbound contacts created
        const records = await this.redisClientPool.run((redisClient) => {
            const pipeline = redisClient.pipeline()
            workList.forEach((workQueueData) => {
                pipeline.lpop(this.makeCampaignExecRecordQueueKey(workQueueData.workData.campaignExecutionId))
            })
            return pipeline.exec()
        })
        return workList.map((workItem, index) => {
            const cacheRecordJson = records![index][1]
            let cacheRecord: CacheRecord | null = null
            if (cacheRecordJson) {
                cacheRecord = JSON.parse(cacheRecordJson as string)
            }
            return {
                campaignExecutionId: workItem.workData.campaignExecutionId,
                workScore: workItem.score,
                executionEndBy: workItem.workData.endBy,
                cacheRecord
            }
        })
    }

    async getAllWork() {
        const result: string[] = await this.redisClientPool.run((redisClient) => {
            return redisClient.zrange(this.prioritisedWorkQueueKey, 0, -1, 'WITHSCORES')
        })
        const toReturn: WorkQueueDataWithScore[] = []
        result.forEach((value, idx) => {
            if (idx % 2 === 0) {
                toReturn.push({
                    workData: JSON.parse(value),
                    score: parseFloat(result[idx+1])
                })
            }
        })
        return toReturn
    }

    async getAllRecords(campaignExecutionId: string) {
        const result: string[] = await this.redisClientPool.run((redisClient) => {
            return redisClient.lrange(this.makeCampaignExecRecordQueueKey(campaignExecutionId), 0, -1)
        })
        return result.map((workJson) => JSON.parse(workJson) as CacheRecord)
    }

    async rescoreCampaign(campaignExecutionId: string, newWeight: number) {
        const result: string[] = await this.redisClientPool.run((redisClient) => {
            return redisClient.zrange(this.prioritisedWorkQueueKey, 0, -1)
        })
        const workForCampaignExec = result.filter((workItem) => JSON.parse(workItem).campaignExecutionId === campaignExecutionId)
        if (workForCampaignExec.length === 0) {
            return
        }
        return this.redisClientPool.run((redisClient) => {
            const pipeline = redisClient.pipeline()
            workForCampaignExec.forEach((workItem) => {
                const newScore = this.makeScore(newWeight)
                pipeline.zadd(this.prioritisedWorkQueueKey, 'XX', newScore, workItem)
            })
            return pipeline.exec()
        })
    }

    public makeCampaignExecRecordQueueKey(campaignExecutionId: string) {
        return `${this.campaignExecutionRecordQueueBaseKey}:${campaignExecutionId}`
    }

    async getCampaignExecQueueSize(campaignExecutionId: string, pipeline?: ChainableCommander): Promise<number> {
        const campaignExecRecordQueueKey = this.makeCampaignExecRecordQueueKey(campaignExecutionId)
        return this.redisClientPool.llen(campaignExecRecordQueueKey, pipeline)
    }

    async mgetCampaignExecQueueSizes(campaignExecutionIds: string[], providedPipeline?: ChainableCommander){
        const campaignExecRecordQueueKeys = campaignExecutionIds.map((campaignExecutionId) => this.makeCampaignExecRecordQueueKey(campaignExecutionId))
        const queueSizes = await this.redisClientPool.runForcePipeline((pipeline) => {
            return Promise.all(campaignExecRecordQueueKeys.map((key) => this.redisClientPool.llen(key, pipeline)))
        }, providedPipeline)
        const toReturn = new Map<string, number>()
        queueSizes!.forEach((result, index) => {
            toReturn.set(campaignExecutionIds[index], result || 0)
        })
        return toReturn
    }
}