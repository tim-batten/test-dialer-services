import { RedisClientPool } from 'navient-services-common/lib/db/redis-client-pool';
import {
  CurrentMetricData,
  GetCurrentMetricDataCommand,
  GetCurrentMetricDataCommandOutput,
} from '@aws-sdk/client-connect';

import { PacingStatsDb } from 'navient-services-common/lib/db/pacing-stats-db';
import { Logger } from 'navient-services-common/lib/logger/logger';
import { setTimeoutLoop } from 'navient-services-common/lib/utils/general';
import { ServiceManager } from 'navient-services-common/lib/utils/service-manager';
import { CampaignExecutionDb } from 'navient-services-common/lib/db/campaign-execution-db';
import { ConnectInstanceServiceManager } from 'navient-services-common/lib/utils/connect-helper';
import { ConnectInstanceService } from 'navient-services-common/lib/utils/connect-instance-service';
import { CampaignExecutionStatus } from 'navient-common/lib/models/campaign-execution';
import { CurrentStats } from 'navient-common/lib/types/stats/current-stats';

export class QueueStatsManager {
  protected readonly logger: Logger = Logger.getLogger();
  private readonly serviceManager = ServiceManager.getInstance();
  jobPrefix = 'stats_monitor';
  redisClientPool: RedisClientPool;
  connectInstanceServiceManager: ConnectInstanceServiceManager;
  queueStatsInterval: number;
  statServiceDb: PacingStatsDb;
  campaignExecutionDb: CampaignExecutionDb;

  constructor(redisClientPool: RedisClientPool, queueStatsInterval: number) {
    this.redisClientPool = redisClientPool;
    this.connectInstanceServiceManager = ConnectInstanceServiceManager.getInstance();
    this.queueStatsInterval = queueStatsInterval;
    this.statServiceDb = new PacingStatsDb(redisClientPool);
    this.campaignExecutionDb = new CampaignExecutionDb(redisClientPool);
  }

  start() {
    setTimeoutLoop(
      async () => {
        await this.checkStats();
        return true;
      },
      'Check task queue stats',
      this.queueStatsInterval,
      {
        immediate: false,
      }
    );
  }

  async monitor(campaignExecutionId: string) {
    try {
      this.logger.log('info', `Acquiring job to monitor task queue stats for ${campaignExecutionId}`);
      await this.serviceManager.acquireJob(this.makeMonitorJobId(campaignExecutionId));
    } catch (e: any) {
      this.logger.log('info', `Not monitoring task queue stats for ${campaignExecutionId}: ${e.message}`);
      return;
    }
  }

  async checkStats() {
    const monitoredExecutionIds = (await this.serviceManager.getJobs()).map((jobId) =>
      this.extractCampaignExecutionId(jobId)
    );
    if (monitoredExecutionIds.length === 0) {
      return true;
    }
    this.logger.log('verbose', `Checking stats for ${monitoredExecutionIds}`);
    const [campaignExecutions, connectInstanceService] = await this.redisClientPool.runForcePipeline((pipeline) => {
      return Promise.all([
        this.campaignExecutionDb.mgetMapWithEmpties(monitoredExecutionIds, pipeline),
        this.connectInstanceServiceManager.get(pipeline),
      ]);
    });
    const queues: Set<string> = new Set();
    for (const [campaignExecutionId, campaignExecution] of campaignExecutions) {
      if (
        !campaignExecution ||
        campaignExecution.status === CampaignExecutionStatus.STOPPING ||
        campaignExecution.allRecordsRequested
      ) {
        this.logger.log('info', `Campaign execution deleted or stopped; not monitoring and releasing job`, {
          entityId: campaignExecutionId,
        });
        this.serviceManager.releaseJob(this.makeMonitorJobId(campaignExecutionId));
        continue;
      }
      if (campaignExecution.status === CampaignExecutionStatus.PAUSED) {
        this.logger.log('info', `Campaign execution is paused - not checking stats`, { entity: campaignExecution });
        continue;
      }
      const queueId = campaignExecution.campaign.BaseConfig.Queue;
      if (queueId) {
        queues.add(queueId);
      }
      // CONNECT_TODO: Remove this, this is just for my own debug
    }
    if (this.logger.isLoggable('debug') && campaignExecutions.size > 0) {
      const campaignExecsList = [...campaignExecutions.values()];
      const query = campaignExecsList.reduce((acc, campaignExecution) => {
        if (campaignExecution) {
          acc.push({
            queueId: campaignExecution.campaign.BaseConfig.Queue || '',
            connectCampaignId: campaignExecution.campaign.ConnectCampaignId,
            from: campaignExecution.statsFromTime,
          });
        }
        return acc;
      }, [] as Parameters<PacingStatsDb['mGetStats']>[0]);
      if (query.length > 0) {
        this.statServiceDb.mGetStats(query).then((stats) => {
          stats.forEach((stat, index) => {
            if (stat) {
              this.logger.mlog('info', [
                `Got stats for campaign execution: ${campaignExecsList[index]?.id}`,
                JSON.stringify(stat, null, 2),
              ]);
            }
          });
        });
      }
    }
    if (queues.size === 0) {
      return true;
    }
    this.logger.mlog('verbose', ['checking queues for stats:', queues]);
    this.getStatsForQueues([...queues], connectInstanceService);

    return true;
  }

  async getStatsForQueues(queues: string[], connectInstanceService: ConnectInstanceService) {
    const { connectClient, connectConfig } = connectInstanceService;
    this.logger.mlog('verbose', ['Getting stats for queues:', queues]);
    const currentCommand = new GetCurrentMetricDataCommand({
      InstanceId: connectConfig.InstanceId,
      Filters: {
        Queues: queues,
      },
      Groupings: ['QUEUE'],
      CurrentMetrics: [
        {
          Name: 'AGENTS_AVAILABLE',
          Unit: 'COUNT',
        },
        {
          Name: 'AGENTS_NON_PRODUCTIVE',
          Unit: 'COUNT',
        },
      ],
    });
    try {
      const currentResult = (await connectClient.send(currentCommand)) as GetCurrentMetricDataCommandOutput;
      // CONNECT_TODO: Perform batch queue query, and insert results in pipeline.
      const statsByQueueId = this.getCurrentStatsByQueueId(currentResult);
      queues.forEach((queueId) => {
        const stats = statsByQueueId[queueId];
        if (stats) {
          this.logger.mlog('verbose', ['Setting stats for queue:', queueId, stats]);
          this.statServiceDb.currentStatsDb.setCurrentStatsForQueue(queueId, stats);
        }
      });
    } catch (e: any) {
      this.logger.log('warn', `Metric Data Retrieval Failed: ${e.message || e}`);
      this.logger.log('debug', e);
    }
  }

  getCurrentStatsByQueueId(result: GetCurrentMetricDataCommandOutput) {
    const queueMap: { [key: string]: CurrentStats } = {};
    for (const metricResult of result.MetricResults || []) {
      const queueId = metricResult.Dimensions?.Queue?.Id;
      if (!queueId || !metricResult.Collections || metricResult.Collections.length === 0) {
        continue;
      }
      const currentStats = this.mapCurrentStatCollectionToCurrentStats(metricResult.Collections);
      queueMap[queueId] = currentStats;
    }
    return queueMap;
  }

  mapCurrentStatCollectionToCurrentStats(collection: CurrentMetricData[]): CurrentStats {
    const toReturn: CurrentStats = {
      availableAgents: 0,
      nonProductiveAgents: 0,
    };
    for (const metricData of collection) {
      switch (metricData.Metric?.Name) {
        case 'AGENTS_AVAILABLE':
          toReturn.availableAgents = metricData.Value || 0;
          break;
        case 'AGENTS_NON_PRODUCTIVE':
          toReturn.nonProductiveAgents = metricData.Value || 0;
          break;
      }
    }
    return toReturn;
  }

  makeMonitorJobId(campaignExecutionId: string) {
    return `${this.jobPrefix}:${campaignExecutionId}`;
  }

  extractCampaignExecutionId(jobId: string) {
    return jobId.substring(this.jobPrefix.length + 1);
  }
}
