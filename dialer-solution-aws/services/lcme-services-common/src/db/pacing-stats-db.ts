import { RedisClientPool } from './redis-client-pool';
import { ChainableCommander } from 'ioredis';
import { CurrentStatsDb } from './current-stats-db';
import { HistoricalStatsDb } from './historical-stats-db';
import { PacingHistoricalStatsKeysAs, PacingStats, zeroPacingStats } from 'lcme-common/lib/types/stats/pacing-stats';

export type QueueInfoParam = {
  queueId: string;
  connectCampaignId: string;
  from: Date;
};

export class PacingStatsDb {
  redisClientPool: RedisClientPool;
  currentStatsDb: CurrentStatsDb;
  historicalStatsDb: HistoricalStatsDb;

  constructor(redisClientPool: RedisClientPool) {
    this.redisClientPool = redisClientPool;
    this.currentStatsDb = new CurrentStatsDb(redisClientPool);
    this.historicalStatsDb = new HistoricalStatsDb(redisClientPool);
  }

  public async getStats(
    queueId: string,
    connectCampaignId: string,
    from: Date,
    pipeline?: ChainableCommander
  ): Promise<PacingStats> {
    const [currentStats, historicalStats] = await this.redisClientPool.runForcePipeline(
      async (pipeline) =>
        await Promise.all([
          this.currentStatsDb.getCurrentStatsForQueue(queueId, pipeline),
          this.historicalStatsDb.getContactStatsForCampaign(
            connectCampaignId,
            PacingHistoricalStatsKeysAs,
            from.getTime(),
            '+inf',
            pipeline
          ),
        ]),
      pipeline
    );
    return {
      current: currentStats || zeroPacingStats.current,
      historical: historicalStats
    };
  }

  public async mGetStats(queueInfos: QueueInfoParam[], pipeline?: ChainableCommander): Promise<PacingStats[]> {
    const stats = await this.redisClientPool.runForcePipeline(
      async (pipeline) =>
        await Promise.all(
          queueInfos.map(({ queueId, connectCampaignId, from }) =>
            this.getStats(queueId, connectCampaignId, from, pipeline)
          )
        ),
      pipeline
    );
    return stats;
  }

  public async getStatsMapByConnectCampaignId(
    queueInfos: { queueId: string; connectCampaignId: string; from: Date }[],
    pipeline?: ChainableCommander
  ): Promise<Map<string, PacingStats>> {
    const stats = await this.mGetStats(queueInfos, pipeline);
    return new Map(stats.map((stat, index) => [queueInfos[index].connectCampaignId, stat]));
  }

  public removeStatsForQueueConnectCampaign(queueId: string, connectCampaignId: string, pipeline?: ChainableCommander) {
    return this.redisClientPool.runForcePipeline((pipeline) => Promise.all([
      this.currentStatsDb.removeCurrentStats(queueId, pipeline),
      this.historicalStatsDb.clearContactStatsForCampaign(connectCampaignId, pipeline)
    ]), pipeline);
  }
}
