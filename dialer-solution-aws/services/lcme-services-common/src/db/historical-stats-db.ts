import { ChainableCommander } from 'ioredis';
import { CampaignDefinition } from 'lcme-common/lib/models/campaign';
import { CampaignExecutionDefinition } from 'lcme-common/lib/models/campaign-execution';
import { Logger } from '../logger/logger';
import { RedisClientPool, ZAddOptArg, ZScore, ZScoreOpt, invertMinMax, makeZScore } from './redis-client-pool';
import {
  HistoricalNonAggregateStatsKey,
  HistoricalStatsKey,
  HistoricalStatsMap,
  HistoricalStatsSettableKey,
  HistoricalStatsType,
} from 'lcme-common/lib/types/stats/historical-stats';
import { StatKeyInfo, Stats, SettableKeys } from 'lcme-common/lib/types/stats/stats';
import _ from 'lodash';

type ContactIdWithScore = {
  contactId: string;
  score: number;
};

type StatSource = 'internal' | 'external';

const getMinMaxForCampaignExec = (
  campaignExecution: CampaignExecutionDefinition
): {
  min: ZScoreOpt;
  max: ZScoreOpt;
} => ({
  min: campaignExecution.executionStartTime?.getTime() || campaignExecution.scheduleOccurrenceStartTime.getTime(),
  max: campaignExecution.lastDialTime?.getTime() || '+inf',
});

const getConnectCampaignId = (campaign: string | CampaignDefinition) =>
  typeof campaign === 'string' ? campaign : campaign.ConnectCampaignId;

export class HistoricalStatsDb {
  private readonly logger = Logger.getLogger();

  private readonly campaignContactStatKeyBase: string;

  constructor(private readonly redisClientPool: RedisClientPool) {
    this.campaignContactStatKeyBase = redisClientPool.makeBaseRedisKey('campaign_contact_stats');
  }

  private makeStatSetTimeStatKey(connectCampaignId: string, statSource: StatSource) {
    return `${this.campaignContactStatKeyBase}:${connectCampaignId}:last_set_time:${statSource}`;
  }

  private makeConnectCampaignContactStatKey(connectCampaignId: string, statKey: HistoricalStatsKey) {
    return `${this.campaignContactStatKeyBase}:${connectCampaignId}:${statKey as string}`;
  }

  private getMinMaxKeyForStat(
    connectCampaignId: string,
    stat: StatKeyInfo<HistoricalStatsType>,
    min: ZScore,
    max: ZScore
  ): {
    /** The redis key */
    statKey: string;
    statMin: ZScore;
    statMax: ZScore;
  } {
    const inverted = stat.inverted;
    const statKey = this.makeConnectCampaignContactStatKey(connectCampaignId, stat.dbKey);
    const minMax = inverted ? invertMinMax({ min, max }) : { min, max };
    return {
      statKey: statKey,
      statMin: minMax.min,
      statMax: minMax.max,
    };
  }

  async setContactStats(
    connectCampaign: string | CampaignDefinition,
    statKeys: HistoricalStatsSettableKey[] | HistoricalStatsSettableKey,
    contactInitiationTime: Date | number,
    contactId: string,
    statSource: 'internal' | 'external',
    pipeline?: ChainableCommander
  ) {
    const statKeysArr = Array.isArray(statKeys) ? statKeys : [statKeys];
    const connectCampaignId = getConnectCampaignId(connectCampaign);
    const statsToSet = HistoricalStatsMap.getStatsToSet(statKeysArr);
    const statsToAdd = [...statsToSet.add].map((statKey) =>
      this.makeConnectCampaignContactStatKey(connectCampaignId, statKey)
    );
    const statsToNegate = [...statsToSet.invert].map((statKey) =>
      this.makeConnectCampaignContactStatKey(connectCampaignId, statKey)
    );
    const score = typeof contactInitiationTime === 'number' ? contactInitiationTime : contactInitiationTime.getTime();
    await this.redisClientPool.runForcePipeline(
      (pipeline) =>
        Promise.all([
          ...statsToAdd.map((statKey) => this.redisClientPool.zaddOpt(statKey, 'NX', score, contactId, pipeline)),
          ...statsToNegate.map((statKey) => this.redisClientPool.zadd(statKey, -score, contactId, pipeline)),
          this.redisClientPool.setex(this.makeStatSetTimeStatKey(connectCampaignId, statSource), 86400, new Date().toISOString(), pipeline),
        ]),
      pipeline
    );
  }

  async getLastStatSetTime(
    connectCampaign: string | CampaignDefinition,
    statSource: StatSource,
    pipeline?: ChainableCommander
  ): Promise<Date | null> {
    const connectCampaignId = getConnectCampaignId(connectCampaign);
    const val = await this.redisClientPool.get(this.makeStatSetTimeStatKey(connectCampaignId, statSource), pipeline);
    return typeof val === 'string' ? new Date(Date.parse(val)) : null;
  }

  async mGetLastStatSetTime(
    connectCampaigns: (string | CampaignDefinition)[],
    statSource: StatSource,
    pipeline?: ChainableCommander
  ): Promise<{ [campaignId: string]: Date | null }> {
    const connectCampaignIds = connectCampaigns.map((campaign) => getConnectCampaignId(campaign));
    const results = await this.redisClientPool.runForcePipeline(
      (pipeline) =>
        Promise.all(
          connectCampaignIds.map((connectCampaignId) =>
            this.getLastStatSetTime(connectCampaignId, statSource, pipeline)
          )
        ),
      pipeline
    );
    return results.reduce((acc, result, index) => {
      acc[connectCampaignIds[index]] = result;
      return acc;
    }, {} as { [campaignId: string]: Date | null });
  }

  async getContactStatBetween(
    connectCampaign: string | CampaignDefinition,
    stat: HistoricalStatsKey,
    min: ZScoreOpt,
    max: ZScoreOpt,
    pipeline?: ChainableCommander
  ): Promise<number> {
    const contactStats = await this.getContactStatsForCampaign(connectCampaign, [stat], min, max, pipeline);
    return contactStats[stat];
  }

  async getContactStatsForCampaign<KEYS extends HistoricalStatsKey>(
    connectCampaign: string | CampaignDefinition,
    stats: KEYS[],
    min: ZScoreOpt,
    max: ZScoreOpt,
    pipeline?: ChainableCommander
  ): Promise<{
    [key in KEYS]: number;
  }> {
    const connectCampaignId = getConnectCampaignId(connectCampaign);
    const statInfos = HistoricalStatsMap.getRequiredDbKeys(stats);
    const statKeyMinMaxes = statInfos.map((statInfo) =>
      this.getMinMaxKeyForStat(connectCampaignId, statInfo, makeZScore(min), makeZScore(max))
    );
    const statCounts = await this.redisClientPool.runForcePipeline(
      (pipeline) =>
        Promise.all(
          statKeyMinMaxes.map(({ statKey, statMin, statMax }) =>
            this.redisClientPool.zcount(statKey, makeZScore(statMin), makeZScore(statMax), pipeline)
          )
        ),
      pipeline
    );
    return HistoricalStatsMap.reduceStatResults(statCounts, statInfos, stats);
  }

  async mGetStatsForCampaigns<KEYS extends HistoricalStatsKey>(
    connectCampaigns: (string | CampaignDefinition)[],
    stats: KEYS[],
    min: ZScoreOpt,
    max: ZScoreOpt,
    pipeline?: ChainableCommander
  ): Promise<{
    [campaignId: string]: {
      [key in KEYS]: number;
    };
  }> {
    const connectCampaignIds = connectCampaigns.map((campaign) => getConnectCampaignId(campaign));
    const results = await this.redisClientPool.runForcePipeline(
      (pipeline) =>
        Promise.all(
          connectCampaignIds.map((connectCampaignId) =>
            this.getContactStatsForCampaign(connectCampaignId, stats, min, max, pipeline)
          )
        ),
      pipeline
    );
    return results.reduce((acc, result, index) => {
      acc[connectCampaignIds[index]] = result;
      return acc;
    }, {} as { [campaignId: string]: { [key in KEYS]: number } });
  }

  async getContactIdsForCampaignStat(
    connectCampaign: string | CampaignDefinition,
    stat: HistoricalNonAggregateStatsKey,
    min: ZScoreOpt,
    max: ZScoreOpt,
    pipeline?: ChainableCommander
  ): Promise<ContactIdWithScore[]> {
    const connectCampaignId = getConnectCampaignId(connectCampaign);
    const nonAggregateKeyInfo = HistoricalStatsMap.getRequiredNonAggregateKey(stat);
    if (!nonAggregateKeyInfo) {
      throw new Error(`Unknown stat type for ${stat as string}`);
    }
    const { statKey, statMin, statMax } = this.getMinMaxKeyForStat(
      connectCampaignId,
      {
        ...nonAggregateKeyInfo,
        requestedKey: stat,
      },
      makeZScore(min),
      makeZScore(max)
    );
    const result = await this.redisClientPool.zrangebyscoreWithScores(statKey, statMin, statMax, pipeline);
    return result.map((member) => ({
      contactId: member[0],
      score: member[1],
    }));
  }

  async mGetContactIdsForCampaignsStat(
    connectCampaigns: (string | CampaignDefinition)[],
    stat: HistoricalNonAggregateStatsKey,
    min: ZScoreOpt,
    max: ZScoreOpt,
    pipeline?: ChainableCommander
  ): Promise<{
    [campaignId: string]: ContactIdWithScore[];
  }> {
    const connectCampaignIds = connectCampaigns.map((campaign) => getConnectCampaignId(campaign));
    const results = await this.redisClientPool.runForcePipeline(
      (pipeline) =>
        Promise.all(
          connectCampaignIds.map((connectCampaignId) =>
            this.getContactIdsForCampaignStat(connectCampaignId, stat, min, max, pipeline)
          )
        ),
      pipeline
    );
    return results.reduce((acc, result, index) => {
      acc[connectCampaignIds[index]] = result;
      return acc;
    }, {} as { [campaignId: string]: { contactId: string; score: number }[] });
  }

  async getContactStatForCampaignExecution(
    campaignExecution: CampaignExecutionDefinition,
    stat: HistoricalStatsKey,
    pipeline?: ChainableCommander
  ): Promise<number> {
    const { min, max } = getMinMaxForCampaignExec(campaignExecution);
    return this.getContactStatBetween(campaignExecution.campaign.ConnectCampaignId, stat, min, max, pipeline);
  }

  async getContactStatsForCampaignExecution<KEYS extends HistoricalStatsKey>(
    campaignExecution: CampaignExecutionDefinition,
    stats: KEYS[],
    pipeline?: ChainableCommander
  ): Promise<{
    [key in KEYS]: number;
  }> {
    const { min, max } = getMinMaxForCampaignExec(campaignExecution);
    return this.getContactStatsForCampaign(campaignExecution.campaign.ConnectCampaignId, stats, min, max, pipeline);
  }

  async mGetStatsForCampaignExecutions<KEYS extends HistoricalStatsKey>(
    campaignExecutions: CampaignExecutionDefinition[],
    stats: KEYS[],
    pipeline?: ChainableCommander
  ): Promise<{
    [campaignId: string]: {
      [key in KEYS]: number;
    };
  }> {
    const results = await this.redisClientPool.runForcePipeline(
      (pipeline) =>
        Promise.all(
          campaignExecutions.map((campaignExec) => {
            const connectCampaignId = getConnectCampaignId(campaignExec.campaign);
            const { min, max } = getMinMaxForCampaignExec(campaignExec);
            return this.getContactStatsForCampaign(connectCampaignId, stats, min, max, pipeline);
          })
        ),
      pipeline
    );
    return results.reduce((acc, result, index) => {
      acc[campaignExecutions[index].id] = result;
      return acc;
    }, {} as { [campaignId: string]: { [key in KEYS]: number } });
  }

  async clearContactStatsForCampaign(connectCampaign: string | CampaignDefinition, pipeline?: ChainableCommander) {
    const connectCampaignId = getConnectCampaignId(connectCampaign);
    const statKeys = HistoricalStatsMap.dbKeys().map((statKey) =>
      this.makeConnectCampaignContactStatKey(connectCampaignId, statKey)
    );
    await this.redisClientPool.runForcePipeline(
      (pipeline) => Promise.all([
        ...statKeys.map((statKey) => this.redisClientPool.del(statKey, pipeline)),
        this.redisClientPool.del(this.makeStatSetTimeStatKey(connectCampaignId, 'internal'), pipeline),
        this.redisClientPool.del(this.makeStatSetTimeStatKey(connectCampaignId, 'external'), pipeline),
      ]),
      pipeline
    );
  }
}
