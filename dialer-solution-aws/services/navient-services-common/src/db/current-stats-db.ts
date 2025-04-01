import { ChainableCommander } from 'ioredis';
import {
    CurrentStats,
} from 'navient-common/lib/types/stats/current-stats';

import { RedisClientPool } from './redis-client-pool';

export class CurrentStatsDb {
  redisClientPool: RedisClientPool;
  statsBaseKey: string;

  constructor(redisClientPool: RedisClientPool) {
    this.redisClientPool = redisClientPool;
    this.statsBaseKey = redisClientPool.makeBaseRedisKey('queue_stats');
  }

  private makeCurrentStatKey(queueId: string) {
    return `${this.statsBaseKey}:${queueId}:current`;
  }

  public async setCurrentStatsForQueue(queueId: string, stats: CurrentStats, pipeline?: ChainableCommander) {
    await this.redisClientPool.jsonSetObject(this.makeCurrentStatKey(queueId), stats, pipeline);
  }

  public async getCurrentStatsForQueue(queueId: string, pipeline?: ChainableCommander): Promise<CurrentStats | null> {
    return await this.redisClientPool.jsonGetObject(this.makeCurrentStatKey(queueId), pipeline);
  }

  public async mGetCurrentStats(
    queueIds: string[],
    pipeline?: ChainableCommander
  ): Promise<Map<string, CurrentStats>> {
    return new Map<string, CurrentStats>(
      (
        await this.redisClientPool.jsonGetObjectsListWithEmpties(
          queueIds.map((queueId) => this.makeCurrentStatKey(queueId)),
          pipeline
        )
      ).map((stats, idx) => [queueIds[idx], stats])
    );
  }

  public removeCurrentStats(queueId: string, pipeline?: ChainableCommander) {
    return this.redisClientPool.del(this.makeCurrentStatKey(queueId), pipeline);
  }
}
