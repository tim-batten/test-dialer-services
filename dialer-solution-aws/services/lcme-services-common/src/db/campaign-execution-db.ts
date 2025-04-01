import {
  PipelineInjection,
  RedisGenericJsonEntityDb,
} from "./redis-generic-json-entity-db";
import { RedisClientPool } from "./redis-client-pool";
import { CampaignExecutionDefinition, CampaignExecutionStatus } from 'lcme-common/lib/models/campaign-execution';
import { QueueDb } from "./queue-db";
import { ChainableCommander } from "ioredis";
import { CampaignPacingDefinition } from 'lcme-common/lib/models/campaign';

export class CampaignExecutionDb extends RedisGenericJsonEntityDb<CampaignExecutionDefinition> {
  cacheEventActionsMapName: string;
  queueDb: QueueDb;

  constructor(redisClientPool: RedisClientPool) {
    super(
      redisClientPool,
      CampaignExecutionDefinition.ENTITY_TYPE,
      CampaignExecutionDefinition.from
    );
    this.cacheEventActionsMapName =
      this.dbBaseName + ".cache_event_actions_map";
    this.queueDb = new QueueDb(redisClientPool);
  }

  public getSimultaneousDeleteEntityKeys(entityId: string): string[] {
    return [this.queueDb.makeCampaignExecRecordQueueKey(entityId)];
  }

  public getIdAndExec(
    campaignExecution: string | CampaignExecutionDefinition
  ): [string, CampaignExecutionDefinition | null] {
    if (typeof campaignExecution === "string") {
      return [campaignExecution, null];
    } else {
      return [campaignExecution.id, campaignExecution];
    }
  }

  public async getIdAndExecFromDb(
    campaignExecution: string | CampaignExecutionDefinition,
    pipeline?: ChainableCommander
  ): Promise<[string, CampaignExecutionDefinition | undefined]> {
    if (typeof campaignExecution === "string") {
      return [campaignExecution, await this.get(campaignExecution, pipeline)];
    } else {
      return [campaignExecution.id, campaignExecution];
    }
  }
  // Remove all pipeline.exec outside of redisClientPool and other managed places
  public async setStartInfo(
    campaignExecution: CampaignExecutionDefinition,
    startTime: Date,
    recordsToDial: number,
    providedPipeline?: ChainableCommander
  ) {
    await this.redisClientPool.runForcePipeline((pipeline) => {
      return Promise.all([
        this.redisClientPool.call("JSON.SET", [
          campaignExecution.id,
          ".executionStartTime",
          "" + startTime.getTime(),
        ], pipeline),
        this.redisClientPool.call("JSON.SET", [
          campaignExecution.id,
          ".recordsToDial",
          "" + recordsToDial,
        ], pipeline),
      ]);
    }, providedPipeline);
    campaignExecution.executionStartTime = startTime;
    campaignExecution.recordsToDial = recordsToDial;
    return;
  }

  public async setStatsFromTime(
    campaignExecution: CampaignExecutionDefinition,
    statsFromTime: Date,
    pipeline?: ChainableCommander
  ) {
    await this.redisClientPool.runP((redisClient) => {
      return redisClient.call(
        "JSON.SET",
        campaignExecution.id,
        ".statsFromTime",
        "" + statsFromTime.getTime()
      );
    }, pipeline);
    campaignExecution.statsFromTime = statsFromTime;
  }

  public async setLastDialTime(
    campaignExecution: CampaignExecutionDefinition,
    lastDialTime: Date,
    pipeline?: ChainableCommander
  ) {
    await this.redisClientPool.runP((redisClient) => {
      return redisClient.call(
        "JSON.SET",
        campaignExecution.id,
        ".lastDialTime",
        "" + lastDialTime.getTime()
      );
    }, pipeline);
    campaignExecution.lastDialTime = lastDialTime;
  }

  public updateLastPacingCalculationResult(
    campaignExecution: CampaignExecutionDefinition,
    lastPacingResult: number,
    lastAbandonRate: number,
    lastCPA: number,
    providedPipeline?: ChainableCommander
  ) {
    campaignExecution.lastPacingCalculationResult = lastPacingResult;
    return this.redisClientPool.runForcePipeline((pipeline) => {
        return Promise.all([
            this.jsonUpdate(
                campaignExecution.id,
                ".lastPacingCalculationResult",
                "" + lastPacingResult,
                pipeline
              ),
              this.jsonUpdate(
                campaignExecution.id,
                ".lastAbandonRate",
                "" + lastAbandonRate,
                pipeline
              ),
              this.jsonUpdate(campaignExecution.id, ".lastCPA", "" + lastCPA, pipeline)
        ])
    }, providedPipeline);
  }

  public setAllRecordsRequested(
    campaignExecutionOrId: CampaignExecutionDefinition | string,
    pipeline?: ChainableCommander
  ) {
    const [campaignExecutionId, campaignExecution] = this.getIdAndExec(
      campaignExecutionOrId
    );
    if (campaignExecution) {
      campaignExecution.allRecordsRequested = true;
    }
    return this.jsonUpdate(
      campaignExecutionId,
      ".allRecordsRequested",
      "true",
      pipeline
    );
  }

  public async incrementRecordsAttempted(
    campaignExecution: CampaignExecutionDefinition
  ) {
    const recordsAttempted = await this.jsonIncr(
      campaignExecution.id,
      ".recordsAttempted"
    );
    campaignExecution.recordsAttempted = recordsAttempted;
    return;
  }

  public async setCacheEventActionsId(
    campaignExecution: CampaignExecutionDefinition,
    eventActionsId: number
  ) {
    campaignExecution.cacheEventActionsId = eventActionsId;
    return this.redisClientPool.run((redisClient) => {
      const pipeline = this.redisClientPool.getMultiOrPipeline(
        redisClient,
        true
      );
      this.jsonUpdate(
        campaignExecution.id,
        ".cacheEventActionsId",
        "" + eventActionsId,
        pipeline
      );
      pipeline.hset(
        this.cacheEventActionsMapName,
        "" + eventActionsId,
        campaignExecution.id
      );
      return pipeline.exec();
    });
  }

  public async getCampaignExecutionIdFromCacheEventActionsId(
    eventActionsId: number,
    pipeline?: ChainableCommander
  ) {
    return this.redisClientPool.hget(
      this.cacheEventActionsMapName,
      "" + eventActionsId,
      pipeline
    );
  }

  public async getCampaignExecutionFromCacheEventActionsId(
    eventActionsId: number,
    pipeline?: ChainableCommander
  ) {
    const campaignExecId =
      await this.getCampaignExecutionIdFromCacheEventActionsId(
        eventActionsId,
        pipeline
      );
    if (!campaignExecId) {
      return;
    }
    return await this.get(campaignExecId);
  }

  public async removeEventActionsIdFromMap(eventActionsId: number) {
    return this.redisClientPool.run((redisClient) => {
      return redisClient.hdel(
        this.cacheEventActionsMapName,
        "" + eventActionsId
      );
    });
  }

  public async setPostbackReceived(
    campaignExecution: CampaignExecutionDefinition,
    cacheEventActionsId: number
  ) {
    campaignExecution.cacheEventActionsId = cacheEventActionsId;
    campaignExecution.hasReceivedPostback = true;
    return await this.redisClientPool.run(async (redisClient) => {
      const pipeline = this.redisClientPool.getMultiOrPipeline(
        redisClient,
        true
      );
      pipeline.call(
        "JSON.SET",
        campaignExecution.id,
        ".cacheEventActionsId",
        "" + cacheEventActionsId
      );
      pipeline.call(
        "JSON.SET",
        campaignExecution.id,
        ".hasReceivedPostback",
        "true"
      );
      return await await pipeline.exec();
    });
  }

  public async setCampaignRunning(
    campaignExecution: CampaignExecutionDefinition
  ) {
    return this.redisClientPool.run((redisClient) => {
      const pipeline = redisClient.pipeline();
      pipeline.call(
        "JSON.SET",
        campaignExecution.id,
        ".status",
        `"${CampaignExecutionStatus.RUNNING}"`
      );
      campaignExecution.status = CampaignExecutionStatus.RUNNING;
      return pipeline.exec();
    });
  }

  public updateStatus(
    campaignExecutionId: string,
    status: CampaignExecutionStatus,
    pipeline?: ChainableCommander
  ) {
    return this.jsonUpdate(campaignExecutionId, ".status", `"${status}"`, pipeline);
  }

  public setCacheReleased(campaignExecution: CampaignExecutionDefinition) {
    campaignExecution.cacheReleased = true;
    return this.jsonUpdate(campaignExecution.id, ".cacheReleased", "true");
  }

  public updatePacing(
    campaignExecutionId: string,
    pacing: CampaignPacingDefinition,
    pipeline?: ChainableCommander
  ) {
    return this.jsonUpdate(
      campaignExecutionId,
      ".currentPacing",
      JSON.stringify(pacing.toPlain()),
      pipeline
    );
  }

  updateWeight(
    campaignExecOrId: string | CampaignExecutionDefinition,
    weight: number,
    pipeline?: ChainableCommander
  ) {
    const [campaignExecutionId, campaignExecution] =
      this.getIdAndExec(campaignExecOrId);
    if (campaignExecution) {
      campaignExecution.campaign.BaseConfig.Weight = weight;
    }
    return this.jsonUpdate(
      campaignExecutionId,
      ".campaign.BaseConfig.Weight",
      "" + weight,
      pipeline
    );
  }

  updateDuration(
    campaignExecOrId: string | CampaignExecutionDefinition,
    duration: number,
    pipeline?: ChainableCommander
  ) {
    const [campaignExecutionId, campaignExecution] =
      this.getIdAndExec(campaignExecOrId);
    if (campaignExecution) {
      campaignExecution.scheduleDuration = duration;
    }
    return this.jsonUpdate(
      campaignExecutionId,
      ".scheduleDuration",
      "" + duration,
      pipeline
    );
  }

  public finalise(campaignExecutionId: string, pipeline?: ChainableCommander) {
    return this.jsonUpdate(campaignExecutionId, ".finalised", "true", pipeline);
  }
}
