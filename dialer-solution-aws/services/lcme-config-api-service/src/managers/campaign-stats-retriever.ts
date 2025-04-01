import { ScheduleExecutionDefinition } from 'lcme-common/lib/models/schedule-execution';
import { CampaignExecutionDefinition } from 'lcme-common/lib/models/campaign-execution';
import { redisClientPool } from '../globals';
import { campaignExecutionDb, pacingStatsDb, scheduleExecutionDb } from '../globals';
import { ChainableCommander } from 'ioredis';
import { CampaignDefinition } from 'lcme-common/lib/models/campaign';
import { AbandonRates, OversightStats } from 'lcme-common/lib/types/oversight-stats';
import { calculateAbandonRate } from 'lcme-services-common/lib/utils/pacing-utils';
import {
  AllHistoricalStatsTypes,
  HistoricalStats, zeroHistoricalStats,
} from 'lcme-common/lib/types/stats/historical-stats';
import { CurrentStats } from 'lcme-common/lib/types/stats/current-stats';
import { HistoricalStatsDb } from 'lcme-services-common/lib/db/historical-stats-db';
import { CurrentStatsDb } from 'lcme-services-common/lib/db/current-stats-db';
import { last } from 'lodash';

export class CampaignStatsRetriever {
  currentStatsDb: CurrentStatsDb;
  historicalStatsDb: HistoricalStatsDb;
  constructor() {
    this.currentStatsDb = new CurrentStatsDb(redisClientPool);
    this.historicalStatsDb = new HistoricalStatsDb(redisClientPool);
  }

  async getOversightStats(scheduleExecutionId: string) {
    const scheduleExecution = await scheduleExecutionDb.get(scheduleExecutionId);
    if (!scheduleExecution) {
      throw new Error(`Schedule-execution with id "${scheduleExecutionId}" not found`);
    }
    const {
      campaign: {
        BaseConfig: { Queue },
      },
      runState: { currentCampaignExecutionId },
    } = scheduleExecution;
    // CONNECT_TODO: Reimplment this, base off camapign execution so we know stats from time
    // const queueStats = Queue ? (await pacingStatsDb.getQueueStats(Queue)) : undefined;
    let campaignExecution: CampaignExecutionDefinition | undefined;
    let inFlightOutboundContacts;
    let totalOutboundContacts;
    let currentStats: CurrentStats | undefined | null;
    let historicalStats: HistoricalStats | undefined;
    let lastStatSetTime: Date | null = null;
    if (currentCampaignExecutionId) {
      campaignExecution = await campaignExecutionDb.get(currentCampaignExecutionId);
      if (!campaignExecution) {
        throw 'Could not get campaign execution';
      }
      const [totalContacts, curStats, histStats, lStatSetTime] = await redisClientPool.runForcePipeline((pipeline) =>
        Promise.all([
          this.historicalStatsDb.getContactStatBetween(
            campaignExecution!.campaign.ConnectCampaignId,
            'initiated',
             0,
            '+inf',
            pipeline
          ),
          pacingStatsDb.currentStatsDb.getCurrentStatsForQueue(Queue, pipeline),
          pacingStatsDb.historicalStatsDb.getContactStatsForCampaignExecution(
            campaignExecution!,
            AllHistoricalStatsTypes,
            pipeline
          ),
          pacingStatsDb.historicalStatsDb.getLastStatSetTime(campaignExecution!.campaign.ConnectCampaignId, 'external', pipeline),
        ])
      );
      totalOutboundContacts = totalContacts || 0;
      currentStats = curStats;
      historicalStats = histStats;
      lastStatSetTime = lStatSetTime;
    }
    return this.formatOversightStats(
      scheduleExecution,
      campaignExecution,
      scheduleExecution.campaign,
      currentStats,
      historicalStats,
      inFlightOutboundContacts,
      lastStatSetTime
    );
  }

  async getAllOversightStats() {
    // Updating this so that all campaign execs are represented rather than just the schedule's current campaign exec
    // This means we have to loop the campaign execs and attach related schedule rather than looping the schedule execs
    const [allScheduleExecutionsMap, allCampaignExecutions] = await redisClientPool.runForcePipeline((pipeline) =>
      Promise.all([scheduleExecutionDb.getAllAsMap(pipeline), campaignExecutionDb.getAllAsList(pipeline)])
    );
    const activeCampaignExecutions = allCampaignExecutions.filter((campainExec) => !campainExec.finalised);
    const connectCampaignIds = [...activeCampaignExecutions].map(
      (campaignExecution) => campaignExecution.campaign.ConnectCampaignId
    );
    const [allCurrentStats, allCampaignExecutionStats, allCampaignStats, allCampaignLastStatTimes] = await Promise.all([
      this.getCurrentStats([
        ...[...allScheduleExecutionsMap.values()].map((se) => se.campaign),
        ...allCampaignExecutions.map((ce) => ce.campaign),
      ]),
      this.getHistoricalStats(allCampaignExecutions),
      this.historicalStatsDb.mGetStatsForCampaigns(connectCampaignIds, AllHistoricalStatsTypes, 0, '+inf'),
      this.historicalStatsDb.mGetLastStatSetTime(connectCampaignIds, 'external'),
    ]);
    const makeOversightStats = (
      scheduleExecution: ScheduleExecutionDefinition | null | undefined,
      campaignExecution: CampaignExecutionDefinition | null | undefined
    ) => {
      if (!scheduleExecution && !campaignExecution) {
        return null;
      }
      const campaign = scheduleExecution ? scheduleExecution.campaign : campaignExecution!.campaign;
      // CONNECT_TODO: Reimplment this, base off camapign execution so we know stats from time
      // const queueStats = allQueueStats.filter(
      //   (queueStat) => queueStat.queueId === campaign.BaseConfig.Queue
      // )[0];
      let totalContactsOnCampaign = 0;
      totalContactsOnCampaign = allCampaignStats[campaign.id]?.initiated || 0;
      const currentStats = allCurrentStats.get(campaign.BaseConfig.Queue);
      const campaignExecutionStats = campaignExecution ? allCampaignExecutionStats[campaignExecution.id] : undefined;
      const campaignCumulativeStats = allCampaignStats[campaign.ConnectCampaignId];
      const lastStatSetTime = allCampaignLastStatTimes[campaign.ConnectCampaignId];
      return this.formatOversightStats(
        scheduleExecution,
        campaignExecution,
        campaign,
        currentStats,
        campaignExecutionStats,
        campaignCumulativeStats,
        lastStatSetTime,
      );
    };

    const referencedScheduleExecs = new Set<string>();
    const toReturn = activeCampaignExecutions.map((campaignExecution) => {
      const scheduleExecution = allScheduleExecutionsMap.get(campaignExecution.scheduleExecutionId);
      referencedScheduleExecs.add(campaignExecution.scheduleExecutionId);
      return makeOversightStats(scheduleExecution, campaignExecution);
    });
    [...allScheduleExecutionsMap.values()]
      .filter((scheduleExec) => !referencedScheduleExecs.has(scheduleExec.id))
      .forEach((scheduleExec) => {
        toReturn.push(makeOversightStats(scheduleExec, undefined));
      });

    return toReturn;
  }

  async getCurrentStats(campaigns: CampaignDefinition[], pipeline?: ChainableCommander) {
    const queueIds = new Set<string>(
      campaigns.map((campaign) => campaign.BaseConfig.Queue).filter((queueId) => queueId) as string[]
    );
    return await pacingStatsDb.currentStatsDb.mGetCurrentStats([...queueIds], pipeline);
  }

  async getHistoricalStats(campaignExecutuons: CampaignExecutionDefinition[], pipeline?: ChainableCommander) {
    return await pacingStatsDb.historicalStatsDb.mGetStatsForCampaignExecutions(
      campaignExecutuons,
      AllHistoricalStatsTypes,
      pipeline
    );
  }

  async getCampaignExecutions(scheduleExecutions: ScheduleExecutionDefinition[], pipeline: ChainableCommander) {
    const campaignExecutionIds = scheduleExecutions
      .map((scheduleExeution) => scheduleExeution.runState.currentCampaignExecutionId)
      .filter((execId) => execId) as string[];
    const campaignExecutions = await campaignExecutionDb.mgetMap(campaignExecutionIds, pipeline);
    if (!campaignExecutions) {
      throw 'Could not fetch task queue stats';
    }
    return campaignExecutions;
  }

  private getWorkerCountInState(activity_statistics: any[], state: string) {
    const workerStats = activity_statistics.find(
      (activity_statistic: any) => activity_statistic.friendly_name === state
    );
    return workerStats && workerStats.workers ? workerStats.workers : 0;
  }

  public formatOversightStats(
    scheduleExecution: ScheduleExecutionDefinition | null | undefined,
    campaignExecution: CampaignExecutionDefinition | null | undefined,
    campaign: CampaignDefinition,
    currentStats: CurrentStats | null | undefined,
    campaignExecutionStats: HistoricalStats | null | undefined,
    campaignCumulativeStats: HistoricalStats | null | undefined,
    lastContactEvent: Date | null,
  ): OversightStats {
    const {
      schedule: { id: scheduleId, ScheduleName, Sequences, Loops },
      status,
      queueName: queueName,
    } = scheduleExecution || {
      schedule: {
        id: campaignExecution?.scheduleId,
        ScheduleName: 'UNKNOWN',
        Sequences: [],
        Loops: 0,
      },
      status: 'UNKNOWN',
      queueName: 'UNKNOWN',
    };
    const currentPacing = scheduleExecution?.currentPacing || campaignExecution?.currentPacing;
    const scheduleExecutionId = scheduleExecution?.id || campaignExecution?.scheduleExecutionId;
    const startTime = scheduleExecution?.scheduleOccurrenceStartTime || campaignExecution?.scheduleOccurrenceStartTime;
    const endTime = scheduleExecution?.getEndTime() || campaignExecution?.getEndByDate();
    const executionStartTime = scheduleExecution?.scheduleExecStartTime || campaignExecution?.scheduleExecStartTime;
    const scheduleTimezone = scheduleExecution?.scheduleIANAZone || campaignExecution?.scheduleIANAZone;
    const duration = scheduleExecution?.schedule.Occurrence.Duration || campaignExecution?.scheduleDuration;
    const {
      id: campaignId,
      CampaignName: campaignName,
      BaseConfig: { Queue: queue, CallingMode, Weight: campaignWeight },
    } = campaign;

    const seqIndexZeroIndexed = campaignExecution
      ? campaignExecution.sequenceIndex
      : scheduleExecution!.runState.currentSequenceIndex;
    const seqLoopZeroIndexed = campaignExecution
      ? campaignExecution.sequenceLoop
      : scheduleExecution!.runState.currentSequenceLoop;

    const numSequences = Sequences.length;
    const totalSequences = numSequences * Loops;
    const sequenceIndexOneIndexed = seqIndexZeroIndexed + 1;
    const sequenceLoopOneIndexed = seqLoopZeroIndexed + 1;

    const sequencesRun = numSequences * seqLoopZeroIndexed + sequenceIndexOneIndexed;

    const currentSequenceDef = scheduleExecution?.schedule.Sequences[seqIndexZeroIndexed];

    let currentSequenceInfo = {};
    let filters = [];
    if (campaignExecution) {
      filters.push(
        ...campaignExecution.filters.map((filter) => {
          return {
            id: filter.id,
            name: filter.filterName,
            type: 'FILTER',
          };
        })
      );
      filters.push(
        ...campaignExecution.sorts.map((sort) => {
          return {
            id: sort.id,
            name: sort.orderByName,
            type: 'SORT',
          };
        })
      );
    }
    currentSequenceInfo = currentSequenceDef
      ? {
          currentSequenceName: currentSequenceDef.SequenceName,
          activePhoneTypes: currentSequenceDef.BasicConfig.Phones,
          currentCampaignExecutionId: campaignExecution?.id || scheduleExecution.runState.currentCampaignExecutionId,
          filters,
        }
      : {
          currentSequenceName: 'UNKNOWN',
          activePhoneTypes: campaignExecution?.phones || [],
          currentCampaignExecutionId: campaignExecution?.id || 'UNKNOWN',
          filters,
        };

    const { recordsAttempted, recordsToDial, lastPacingCalculationResult, lastCPA, lastAbandonRate } =
      campaignExecution || {};

    const contactFlowId = campaignExecution?.contactFlowId || scheduleExecution?.contactFlowId || 'UNKNOWN';

    const campaignInfo: OversightStats['campaignInfo'] = {
      campaignId,
      campaignName,
      queue,
      contactFlowId,
    };
    // CONNECT_TODO: Fix up these stats or oversight will be wrong..
    // Everything commented below and in response body covers it
    // const {
    //   cumulative: { reservations_completed = 0, tasks_canceled = 0, tasks_entered = 0, reservations_accepted = 0 },
    //   realtime: { activity_statistics = [], tasks_by_status = {} },
    // } = queueStats || { cumulative: {}, realtime: {} };
    // const offlineWorkers = this.getWorkerCountInState(activity_statistics, 'Offline');
    // const unavailableWorkers = this.getWorkerCountInState(activity_statistics, 'Unavailable');
    // const breakWorkers = this.getWorkerCountInState(activity_statistics, 'Break');
    const campaignExecHistorical = campaignExecutionStats || zeroHistoricalStats;
    const campaignHistorical = campaignCumulativeStats || zeroHistoricalStats;
    const campaignAbandonRate: AbandonRates = {
      detects: calculateAbandonRate('Detects', campaignHistorical),
      connects: calculateAbandonRate('Connects', campaignHistorical),
      calls: calculateAbandonRate('Calls', campaignHistorical),
    };
    const campaignExecutionStatsAbandonRate: AbandonRates = {
      detects: calculateAbandonRate('Detects', campaignExecHistorical),
      connects: calculateAbandonRate('Connects', campaignExecHistorical),
      calls: calculateAbandonRate('Calls', campaignExecHistorical),
    };
    const oversightStats: OversightStats = {
      scheduleId: scheduleId!,
      scheduleName: ScheduleName,
      scheduleExecutionId: scheduleExecutionId!,
      startTime: startTime!,
      endTime: endTime,
      executionStartTime: executionStartTime,
      scheduleTimezone: scheduleTimezone!,
      duration: duration!,
      campaignWeight: campaignWeight!,
      campaignMode: CallingMode,
      status,
      campaignInfo,
      progressInfo: {
        sequenceProgress: {
          recordsToDial: recordsToDial,
          recordsAttempted: recordsAttempted,
          lastPacingCalculation: lastPacingCalculationResult,
          lastAbandonRate: lastAbandonRate,
          lastCPA: lastCPA,
        },
        scheduleProgress: {
          numSequences,
          numLoops: Loops,
          totalSequences,
          currentSequenceIndex: sequenceIndexOneIndexed,
          currentLoop: sequenceLoopOneIndexed,
          currentSequence: sequencesRun,
        },
        currentSequenceInfo,
      },
      queueInfo: {
        queueId: campaign.BaseConfig.Queue,
        queueName,
      },
      campaignStats: {
        campaignExecution: {
          historicalStats: campaignExecutionStats,
          abandonRates: campaignExecutionStatsAbandonRate,
        },
        campaign: {
          historicalStats: campaignCumulativeStats,
          abandonRates: campaignAbandonRate,
        },
        lastContactEvent,
        current: currentStats,
      },
      pacing: currentPacing,
    };
    return oversightStats;
  }
}
