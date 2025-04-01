import { ChainableCommander } from 'ioredis';
import { CacheRecord, getRecordLatestAllowableTime } from 'lcme-common/lib/models/cache-record';
import { CampaignExecutionDefinition, CampaignExecutionStatus } from 'lcme-common/lib/models/campaign-execution';
import {
  PacingHistoricalStatsKeys,
  PacingHistoricalStatsKeysAs,
  PacingStats,
} from 'lcme-common/lib/types/stats/pacing-stats';
import { ContactInfoDb } from 'lcme-services-common/lib/db/contact-info-db';
import { QueueDb } from 'lcme-services-common/lib/db/queue-db';
import { Logger } from 'lcme-services-common/lib/logger/logger';
import { mapToObj, removeEmpties, setTimeoutLoop } from 'lcme-services-common/lib/utils/general';
import { calculateAbandonRate } from 'lcme-services-common/lib/utils/pacing-utils';
import { ServiceManager } from 'lcme-services-common/lib/utils/service-manager';
import { OutboundContactConfig, serviceConfig } from './config/config';
import { QueueControlStreamMonitor } from './db/queue-control-stream-monitor';
import { QueueEventStreamPublisher } from './db/queue-event-stream-publisher';
import { cacheFetcher, campaignExecutionDb, pacingStatsDb, redisClientPool } from './globals';
import { OutboundContactManager } from './outbound-contact-manager';
import { HistoricalStatsDb } from 'lcme-services-common/lib/db/historical-stats-db';

type ActiveCallStats = {
  currentQueueSize: number;
  currentPendingDials: number;
  inFlightContacts: number;
};

type CampaignCumulativeStats = {
  initiated: number;
  in_flight: number;
}

export class QueueManager {
  protected readonly logger: Logger = Logger.getLogger();
  serviceManager: ServiceManager = ServiceManager.getInstance();
  busyExecutions: Set<string> = new Set<string>();
  queueDb: QueueDb;
  contactInfoDb: ContactInfoDb;
  historicalStatsDb: HistoricalStatsDb;
  queueControlMonitor: QueueControlStreamMonitor;
  queueEventStream: QueueEventStreamPublisher;
  outboundContactManager: OutboundContactManager;
  outboundContactConfig: OutboundContactConfig = serviceConfig.outboundContacts;

  constructor() {
    this.queueControlMonitor = new QueueControlStreamMonitor(redisClientPool, this);
    this.queueDb = new QueueDb(redisClientPool);
    this.contactInfoDb = new ContactInfoDb(redisClientPool);
    this.queueEventStream = new QueueEventStreamPublisher(redisClientPool);
    this.outboundContactManager = new OutboundContactManager(this, this.queueDb);
    this.historicalStatsDb = new HistoricalStatsDb(redisClientPool);
  }

  async start() {
    // CONNECT_TODO: Stats service now keeping track of inflight calls so it we no longer
    // call checkEndState here when calls no longer in flight as we have no awareness of that.
    // Will need to periodically check endState on completed campaigns.
    this.outboundContactManager.start();
    const consumerId = serviceConfig.queueControlMonitor.consumerId;
    this.queueControlMonitor.start(consumerId);
    await setTimeoutLoop(
      async () => {
        const monitoredExecutionIds = (await this.serviceManager.getJobs()).filter((execId) => {
          if (this.busyExecutions.has(execId)) {
            this.logger.log('info', `Skipping ${execId} this loop - busy enqueueing`);
            return false;
          }
          this.busyExecutions.add(execId);
          return true;
        });
        if (monitoredExecutionIds.length === 0) {
          return true;
        }
        try {
          const expiryTime = Date.now() - serviceConfig.queue.outboundContactResultWaitTime;
          const [campaignExecutionsWithEmpties, campaignExecQueueSizes] = await redisClientPool.runForcePipeline(
            (pipeline) =>
              Promise.all([
                campaignExecutionDb.mgetListWithEmpties(monitoredExecutionIds, pipeline),
                this.queueDb.mgetCampaignExecQueueSizes(monitoredExecutionIds, pipeline),
              ])
          );
          const removedCampaignExecutionIds = campaignExecutionsWithEmpties
            .map((campaignExecution, index) => (campaignExecution ? undefined : monitoredExecutionIds[index]))
            .filter((id) => id) as string[];
          removedCampaignExecutionIds.forEach((campaignExecutionId) => {
            this.serviceManager.releaseJob(campaignExecutionId);
          });
          const campaignExecutions = campaignExecutionsWithEmpties.filter(
            (campaignExecution) => campaignExecution
          ) as CampaignExecutionDefinition[];
          const connectCampaignIds = [
            ...new Set(campaignExecutions.map((campaignExecution) => campaignExecution.campaign.ConnectCampaignId)),
          ];
          const expiredContacts = await this.historicalStatsDb.mGetContactIdsForCampaignsStat(
            connectCampaignIds,
            'in_flight',
            0,
            expiryTime
          );
          const queueInfos = removeEmpties(
            campaignExecutions.map((campaignExecution) => ({
              queueId: campaignExecution.campaign.BaseConfig.Queue!,
              connectCampaignId: campaignExecution.campaign.ConnectCampaignId,
              from: campaignExecution.statsFromTime,
            }))
          );
          if (Object.keys(expiredContacts).length > 0) {
            redisClientPool.runForcePipeline((pipeline) =>
              Promise.all(
                [...Object.entries(expiredContacts)].reduce((acc, [connectCampaignId, contacts]) => {
                  if (contacts.length === 0) {
                    return acc;
                  }
                  this.logger.log(
                    'info',
                    `${contacts.length} flows have expired on connect campaign ${connectCampaignId} - marking as finished`,
                    { entityId: connectCampaignId }
                  );
                  contacts.forEach((contact) => {
                    acc.push(
                      this.historicalStatsDb.setContactStats(
                        connectCampaignId,
                        'in_flight_timeout',
                        contact.score,
                        contact.contactId,
                        'internal',
                        pipeline
                      )
                    );
                  });
                  return acc;
                }, [] as Promise<any>[])
              )
            );
          }
          const debugLog = this.logger.isLoggable('debug');
          const [allConnectCampaignStats, allCampaignExecStats] = await redisClientPool.runForcePipeline((pipeline) =>
            Promise.all([
              this.historicalStatsDb.mGetStatsForCampaigns(
                queueInfos.map((queueInfos) => queueInfos.connectCampaignId),
                ['in_flight', 'initiated'],
                0,
                '+inf',
                pipeline
              ),
              pacingStatsDb.getStatsMapByConnectCampaignId(queueInfos, pipeline),
            ])
          );
          if (debugLog) {
            this.logger.log(
              'debug',
              `Campaign Stats: ${JSON.stringify(
                allConnectCampaignStats,
                null,
                2
              )}\nCampaign execution stats: ${JSON.stringify(mapToObj(allCampaignExecStats), null, 2)}`
            );
          }

          for (const campaignExecution of campaignExecutions) {
            const campaignExecPacingStats = allCampaignExecStats.get(campaignExecution.campaign.ConnectCampaignId)!;
            // We cap the concurrent call campaign-wide (schedule sequence doesn't matter here, it's still a cap on the campaign).
            // We use the (inferred) campaign exec call count to determine if the campaign execution (schedule sequence) has finished dialling.
            const campaignStats = allConnectCampaignStats[campaignExecution.campaign.ConnectCampaignId];
            const currentQueueSize = campaignExecQueueSizes.get(campaignExecution.id) || 0;
            this.checkEndState(campaignExecution, campaignExecPacingStats.historical.in_flight, currentQueueSize).then((isEnded) => {
              if (isEnded) {
                return;
              }
              this.queueMoreRecords(
                campaignExecution,
                campaignExecPacingStats,
                campaignStats,
                currentQueueSize
              )
                .then(() => {
                  this.busyExecutions.delete(campaignExecution.id);
                })
                .catch((e) => {
                  this.logger.log('error', e);
                  this.busyExecutions.delete(campaignExecution.id);
                });
            });
          }
        } catch (e) {
          this.logger.log('error', e);
          monitoredExecutionIds.forEach((execId) => {
            this.busyExecutions.delete(execId);
          });
        }
        return true;
      },
      'Record enqueue',
      serviceConfig.queue.enqueueFrequecy,
      {
        immediate: true,
      }
    );
  }

  async startQueue(campaignExecutionId: string) {
    try {
      this.logger.log('debug', `Acquiring job for ${campaignExecutionId}`, { entityId: campaignExecutionId });
      await this.serviceManager.acquireJob(`${campaignExecutionId}`);
      const campaignExecution = await campaignExecutionDb.get(campaignExecutionId);
      if (campaignExecution) {
        await this.setQueueRunning(campaignExecution);
      }
    } catch (e: any) {
      this.logger.log('info', `Not starting queue for ${campaignExecutionId}: ${e.message}`, {
        entityId: campaignExecutionId,
      });
    }
  }

  async setQueueRunning(campaignExecution: CampaignExecutionDefinition) {
    await this.queueDb.deleteRecordList(campaignExecution.id);
    await campaignExecutionDb.setCampaignRunning(campaignExecution);
  }

  async stopQueue(campaignExecutionId: any) {
    // this.logger.log('info', 'Stopping queue for campaign execution id', campaignExecutionId)
    // const queue = this.activeQueues[campaignExecutionId]
    // if (!queue) {
    //     this.logger.log('info', `Cannot stop queue for ${campaignExecutionId} as it does not exist - sending complete events`)
    //     await this.queueEventStream.queueComplete(campaignExecutionId)
    //     await this.queueEventStream.queueFinalised(campaignExecutionId)
    //     return
    // }
    // queue.stop()
  }

  async queueComplete(campaignExecution: CampaignExecutionDefinition) {
    this.logger.log('info', 'Queue complete', { entity: campaignExecution });
    await campaignExecutionDb.setAllRecordsRequested(campaignExecution);
    this.queueEventStream.queueComplete(campaignExecution.id);
  }

  async queueFinalised(campaignExecutionId: string) {
    this.logger.log('info', 'Queue finalised', { entityId: campaignExecutionId });
    this.queueEventStream.queueFinalised(campaignExecutionId);
  }

  async queueExpired(campaignExecution: CampaignExecutionDefinition) {
    this.logger.log('info', 'Queue expired', { entity: campaignExecution });
    await campaignExecutionDb.setAllRecordsRequested(campaignExecution);
    this.queueEventStream.queueExpired(campaignExecution.id);
  }

  async queueFailed(campaignExecution: CampaignExecutionDefinition, reason: string) {
    this.logger.log('info', 'Queue failed', { entity: campaignExecution });
    await campaignExecutionDb.setAllRecordsRequested(campaignExecution);
    this.queueEventStream.queueFailed(campaignExecution.id, reason);
  }

  async contactStarted(outboundContactId: string, campaignExecution: CampaignExecutionDefinition) {
    // this.checkEndState(campaignExecution);
  }

  async outboundContactFailed(campaignExecution: CampaignExecutionDefinition, cacheRecord: CacheRecord, e: any) {
    this.logger.mlog(
      `debug`,
      ['Outbound contact failed on campaign execution', campaignExecution.id, 'with reason', e],
      {
        entity: campaignExecution,
      }
    );
    // this.checkEndState(campaignExecution);
  }

  async queueMoreRecords(
    campaignExecution: CampaignExecutionDefinition,
    campaignExecutinPacingStats: PacingStats,
    campaignStats: CampaignCumulativeStats,
    currentQueueSize: number
  ) {
    this.logger.log('debug', `${campaignExecution.id} - Queue more records for campaign execution`, {
      entity: campaignExecution,
    });
    if (campaignExecution.allRecordsRequested) {
      return this.logger.log('info', `All records requested - not retrieving more.`, { entity: campaignExecution });
    }
    if (!campaignExecution.cacheEventActionsId) {
      this.logger.log('info', `${campaignExecution.id} - No cache event actions ID`);
      return await this.queueFailed(campaignExecution, `No cache event actions ID for ${campaignExecution.id}`);
    }
    if (campaignExecution.status === CampaignExecutionStatus.STARTING) {
      this.logger.log('info', `${campaignExecution.id} is STARTING - setting to RUNNING`, {
        entity: campaignExecution,
      });
      await this.setQueueRunning(campaignExecution);
    }
    if (campaignExecution.status === CampaignExecutionStatus.PAUSED) {
      this.logger.log('info', `Not queueing more records for now - ${campaignExecution.id} is PAUSED`, {
        entity: campaignExecution,
      });
      return;
    }
    if (campaignExecution.status === CampaignExecutionStatus.STOPPING) {
      this.logger.log('info', `Not queueing more records - ${campaignExecution.id} is STOPPING`, {
        entity: campaignExecution,
      });
      await campaignExecutionDb.setAllRecordsRequested(campaignExecution);
      return await this.queueComplete(campaignExecution);
    }
    if (campaignExecution.shouldBeFinishedAt(new Date())) {
      this.logger.log('info', 'Queue "end by" reached, not retrieving more records', { entity: campaignExecution });
      await this.queueExpired(campaignExecution);
      return await this.queueComplete(campaignExecution);
    }
    const currentPendingDials = this.outboundContactManager.countPendingCalls(campaignExecution.id);
    const activeCallStats: ActiveCallStats = {
      currentQueueSize,
      currentPendingDials,
      inFlightContacts: campaignStats.in_flight,
    };
    this.logger.mlog('debug', ['Active call stats', activeCallStats], { entity: campaignExecution });
    let pacingResult = await this.calculatePacingInfo(
      campaignExecution,
      campaignExecutinPacingStats,
      activeCallStats,
      campaignStats.initiated
    );

    campaignExecutionDb.updateLastPacingCalculationResult(
      campaignExecution,
      pacingResult.recordsToFetch,
      pacingResult.abaRate,
      pacingResult.callsPerAgent
    );
    const numRecordsToFetch = pacingResult.recordsToFetch;
    this.logger.log('verbose', `${campaignExecution.id} Pacing calculation returned ${numRecordsToFetch}`, {
      entity: campaignExecution,
    });
    if (!numRecordsToFetch || numRecordsToFetch <= 0) {
      return;
    }
    const cacheFetchResult = await cacheFetcher.fetchCacheRecords(campaignExecution, numRecordsToFetch, true);
    if (!cacheFetchResult || !cacheFetchResult.returnData || cacheFetchResult.returnData.length === 0) {
      this.logger.log('info', 'Received no records from cache - queue complete', { entity: campaignExecution });
      return this.queueComplete(campaignExecution);
    }
    const warning = cacheFetchResult.getWarning();
    if (warning) {
      this.logger.log(
        'info',
        `Received warning ${warning} from cache fetch result indicating no records left to fetch`,
        { entity: campaignExecution }
      );
      return this.queueComplete(campaignExecution);
    }
    const now = Date.now();
    const recordsToQueue = cacheFetchResult.returnData.filter((cacheRecord) => {
      const latestAllowableServerTime = getRecordLatestAllowableTime(
        cacheRecord,
        serviceConfig.crudApi.crudApiTimezone
      );
      if (latestAllowableServerTime.getTime() < now) {
        this.logger.log(
          'info',
          `Ignoring ${cacheRecord.phoneNumber} as latest allowable time set to: ${
            cacheRecord.latestAllowableServerTime
          } (adjusted to: ${latestAllowableServerTime.toISOString()} based on CRUD server timezone of ${
            serviceConfig.crudApi.crudApiTimezone
          })`,
          { entity: campaignExecution }
        );
        return false;
      }
      return true;
    });
    if (recordsToQueue.length === 0) {
      this.logger.log(
        'info',
        'All records received from cache have last allowable time in the past, nothing to queue this loop',
        { entity: campaignExecution }
      );
      return;
    }
    await this.queueDb.queueRecords(campaignStats.initiated, campaignExecution, recordsToQueue);
    return;
  }

  sanitizeCPA(campaignExecution: CampaignExecutionDefinition, callsPerAgent: number) {
    const maxCPA = campaignExecution.currentPacing.MaxCPA;
    if ((!callsPerAgent && callsPerAgent !== 0) || isNaN(callsPerAgent) || typeof callsPerAgent !== 'number') {
      this.logger.log('info', `Calls per agent is ${callsPerAgent} - normalising to 0`, { entity: campaignExecution });
      return 0;
    } else if (callsPerAgent < 1) {
      this.logger.log(`info`, `Calls per agent was ${callsPerAgent} which is less than 1, normalising to 1`, {
        entity: campaignExecution,
      });
      return 1;
    } else if (maxCPA > 0 && callsPerAgent > maxCPA) {
      this.logger.log(
        `info`,
        `Calls per agent was ${callsPerAgent} which is greater than max CPA of ${maxCPA}, normalising to ${maxCPA}`,
        { entity: campaignExecution }
      );
      return maxCPA;
    }
    this.logger.log('verbose', `sanitizeCPA: Calls per agent is ${callsPerAgent} (MaxCPA ${maxCPA})`, {
      entity: campaignExecution,
    });
    return callsPerAgent;
  }

  getMaxConcurrent(campaignExecution: CampaignExecutionDefinition) {
    if (serviceConfig.dev.destinationPhoneNumber && !serviceConfig.dev.skipFlowExecution) {
      return 1;
    }
    return campaignExecution.currentPacing.ConcurrentCalls || Infinity;
  }

  calculateRecordsToFetchCPA(
    campaignExecution: CampaignExecutionDefinition,
    activeCallStats: ActiveCallStats,
    callsPerAgent: number,
    availableAgents: number
  ) {
    const { currentQueueSize, inFlightContacts: activeContacts, currentPendingDials } = activeCallStats;
    const maxConcurrent = this.getMaxConcurrent(campaignExecution);
    if (!availableAgents || isNaN(availableAgents) || typeof availableAgents !== 'number' || availableAgents <= 0) {
      this.logger.log('verbose', `Available agents is ${availableAgents} - normalising records to fetch to 0`, {
        entity: campaignExecution,
      });
      return 0;
    }
    const desiredCallsInFlight = Math.ceil(callsPerAgent * availableAgents);
    const allowedInFlight = Math.min(maxConcurrent, desiredCallsInFlight);
    this.logger.log(
      'silly',
      `calculateRecordsToFetchCPA: Allowed in flight is ${allowedInFlight}, desired is ${desiredCallsInFlight}, cap is ${maxConcurrent}`,
      {
        entity: campaignExecution,
      }
    );
    this.logger.log(
      'verbose',
      `Records to fetch base calculation is (${availableAgents} Idle agents * ${callsPerAgent} CPA) - Desired calls in flight: ${desiredCallsInFlight}${
        allowedInFlight < desiredCallsInFlight ? ` (capped by maxConcurrent of ${maxConcurrent})` : ``
      }`,
      { entity: campaignExecution }
    );
    const recordsToFetchLessInFlight = allowedInFlight - currentQueueSize - activeContacts - currentPendingDials;
    this.logger.log(
      'info',
      `Records to fetch is ${recordsToFetchLessInFlight} based on (${allowedInFlight} - ${currentQueueSize} queued executions - ${activeContacts} in flight executions) - ${currentPendingDials} pending dials` +
        { entity: campaignExecution }
    );
    if (recordsToFetchLessInFlight <= 0) {
      this.logger.log('verbose', 'Not dialing - too many calls in flight', { entity: campaignExecution });
      return 0;
    }
    return recordsToFetchLessInFlight;
  }

  async calculatePacingInfo(
    campaignExecution: CampaignExecutionDefinition,
    pacingStats: PacingStats | undefined,
    activeCallStats: ActiveCallStats,
    totalCallsPlaced: number
  ) {
    if (campaignExecution.campaign.BaseConfig.CallingMode === 'agentless') {
      const { currentQueueSize, inFlightContacts: activeContacts, currentPendingDials } = activeCallStats;
      const maxConcurrentCalls = this.getMaxConcurrent(campaignExecution);
      const recordsToDial = Math.max(0, maxConcurrentCalls - currentQueueSize - activeContacts - currentPendingDials);
      this.logger.log(
        'info',
        `Agentless campaign - records to dial is ${recordsToDial} based on max concurrent calls ` +
          `(${maxConcurrentCalls}) - queued outbound contacts (${currentQueueSize}) ` +
          `- active outbound contacts (${activeContacts}) - current pending dials (${currentPendingDials})`,
        {
          entity: campaignExecution,
        }
      );
      return this.makePacingResult(recordsToDial, 0, 0);
    }
    try {
      const pacingConfig = campaignExecution.currentPacing;
      let callsPerAgent = this.sanitizeCPA(campaignExecution, pacingConfig.InitialCPA);
      let recordsToFetch = 0;
      const queueId = campaignExecution.campaign.BaseConfig.Queue;
      if (!pacingStats) {
        this.logger.log('info', `No pacing stats for ${queueId}`, { entity: campaignExecution });
        return this.makePacingResult(recordsToFetch, campaignExecution.lastAbandonRate, callsPerAgent);
      }
      const { historical, current } = pacingStats;
      const abandonRate = calculateAbandonRate(campaignExecution.currentPacing.AbaCalculation, pacingStats.historical, {
        logger: this.logger,
        loggerOptions: { entity: campaignExecution },
      });
      const { availableAgents } = current;
      if (serviceConfig.dev.destinationPhoneNumber && !serviceConfig.dev.skipFlowExecution) {
        this.logger.log('info', `dev destination phone number set, available agents is ${availableAgents}`, { entity: campaignExecution });
        recordsToFetch = this.calculateRecordsToFetchCPA(
          campaignExecution,
          activeCallStats,
          pacingConfig.InitialCPA,
          Math.min(1, availableAgents)
        );
        return this.makePacingResult(recordsToFetch, abandonRate, callsPerAgent);
      }

      const contactRate =
        historical.queued === 0 || totalCallsPlaced === 0
          ? 0.001
          : Math.max(0.001, historical.queued / totalCallsPlaced);
      this.logger.log(
        'info',
        `Contact rate is ${contactRate} (${historical.queued} entered into queue / ${totalCallsPlaced} calls placed)`,
        { entity: campaignExecution }
      );

      if (pacingConfig.InitialDuration === 0) {
        this.logger.log('info', `Initial duration set to 0 (infinite), using initial CPA ${pacingConfig.InitialCPA}`, {
          entity: campaignExecution,
        });
        recordsToFetch = this.calculateRecordsToFetchCPA(
          campaignExecution,
          activeCallStats,
          pacingConfig.InitialCPA,
          availableAgents
        );
        return this.makePacingResult(recordsToFetch, abandonRate, callsPerAgent);
      } else if (pacingConfig.InitialCPAMode === 'duration') {
        const initialDurationMs = pacingConfig.InitialDuration * 60000;
        const nowMillis = Date.now();
        if (campaignExecution.executionStartTime.getTime() + initialDurationMs > nowMillis) {
          this.logger.log(
            'verbose',
            `Within initial pacing duration (${initialDurationMs}ms) - using initial CPA of ${pacingConfig.InitialCPA}`,
            { entity: campaignExecution }
          );
          recordsToFetch = this.calculateRecordsToFetchCPA(
            campaignExecution,
            activeCallStats,
            pacingConfig.InitialCPA,
            availableAgents
          );
          return this.makePacingResult(recordsToFetch, abandonRate, callsPerAgent);
        }
      } else if (pacingConfig.InitialCPAMode === 'samples') {
        if (totalCallsPlaced < pacingConfig.InitialDuration) {
          this.logger.log(
            'verbose',
            `Within initial pacing window (${totalCallsPlaced} of ${pacingConfig.InitialDuration} samples) - using initial CPA of ${pacingConfig.InitialCPA}`,
            { entity: campaignExecution }
          );
          recordsToFetch = this.calculateRecordsToFetchCPA(
            campaignExecution,
            activeCallStats,
            pacingConfig.InitialCPA,
            availableAgents
          );
          return this.makePacingResult(recordsToFetch, abandonRate, callsPerAgent);
        }
      }

      if (!pacingStats || !current.availableAgents || current.availableAgents === 0) {
        return this.makePacingResult(recordsToFetch, abandonRate, callsPerAgent);
      }
      // CONNECT_TODO: We don't have an equivalent of RESERVATIONS_CREATED; ensure this stat is OK
      if (historical.queued === 0) {
        this.logger.log('info', `queued is 0 - using initial CPA of ${pacingConfig.InitialCPA}`, {
          entity: campaignExecution,
        });
        recordsToFetch = this.calculateRecordsToFetchCPA(
          campaignExecution,
          activeCallStats,
          pacingConfig.InitialCPA,
          current.availableAgents
        );
        return this.makePacingResult(recordsToFetch, abandonRate, callsPerAgent);
      }

      const callsPerAgentModifier = pacingConfig.CpaModifier / 100.0;
      const abandonIncrement = pacingConfig.AbaIncrement / 100.0;
      const targetRate = pacingConfig.AbaTargetRate / 100.0;

      //Note: Using percentage values from config (e.g. 5% = 5 and not 0.5) as /100 introduces floating point
      //calculation inaccuracies

      const rawCPA = 100 / (contactRate * 100);
      this.logger.log('info', `Raw CPA: ${rawCPA} based on (100 / (${contactRate} contactRate * 100))`, {
        entity: campaignExecution,
      });
      callsPerAgent = rawCPA * (((targetRate - abandonRate) / abandonIncrement) * callsPerAgentModifier) + rawCPA;
      this.logger.log(
        'info',
        `Adjusted CPA: ${callsPerAgent} based on ${rawCPA} rawCPA * (((${targetRate} targetRate ` +
          `- ${abandonRate} abandonRate) / ${abandonIncrement} abandonIncrement) * ${callsPerAgentModifier} callsPerAgentModifier) + ${rawCPA} rawCPA`,
        { entity: campaignExecution }
      );

      callsPerAgent = this.sanitizeCPA(campaignExecution, callsPerAgent);
      recordsToFetch = this.calculateRecordsToFetchCPA(
        campaignExecution,
        activeCallStats,
        callsPerAgent,
        current.availableAgents
      );
      this.logger.mlog('info', ['Records to fetch is', recordsToFetch, 'based on', pacingStats, pacingConfig], {
        entity: campaignExecution,
      });
      return this.makePacingResult(recordsToFetch, abandonRate, callsPerAgent);
    } catch (error) {
      this.logger.log(
        'error',
        `Error on Queue ${campaignExecution.campaign.BaseConfig.Queue} when calculating pacing stats: ${error}`,
        { entity: campaignExecution }
      );
      return this.makePacingResult(0, 0, 0);
    }
  }

  makePacingResult(recordsToFetch: number, abaRate: number, callsPerAgent: number) {
    return {
      recordsToFetch,
      abaRate,
      callsPerAgent,
    };
  }

  async checkEndStateFromDb(campaignExecutionId: string, pipeline?: ChainableCommander) {
    const [campaignExecution, queuedContacts] = await redisClientPool.runForcePipeline(
      (pipeline) =>
        Promise.all([
          campaignExecutionDb.get(campaignExecutionId, pipeline),
          this.queueDb.getCampaignExecQueueSize(campaignExecutionId, pipeline),
        ]),
      pipeline
    );
    if (!campaignExecution) {
      return;
    }
    const activeContacts = await this.historicalStatsDb.getContactStatForCampaignExecution(
      campaignExecution,
      'in_flight'
    );
    return await this.checkEndState(campaignExecution, activeContacts, queuedContacts);
  }

  async checkEndState(
    campaignExecution: CampaignExecutionDefinition,
    activeContacts: number,
    queuedContacts: number
  ): Promise<boolean> {
    if (!campaignExecution.allRecordsRequested) {
      this.logger.log(
        'debug',
        `Checking end state for ${campaignExecution.id} - all records not requested yet, not ended`,
        { entity: campaignExecution }
      );
      return false;
    }
    if (campaignExecution.finalised) {
      this.logger.log('debug', `Campaign execution ${campaignExecution.id} already finialised, ignoring`, {
        entity: campaignExecution,
      });
      return false;
    }
    const pendingContacts = this.outboundContactManager.countPendingCalls(campaignExecution.id);
    const totalInProgressContacts = activeContacts + queuedContacts + pendingContacts;
    if (totalInProgressContacts === 0) {
      this.logger.log(
        'info',
        `Checking end state for ${campaignExecution.id} - all records requested, no in progress contacts - finalising campaign execution`,
        { entity: campaignExecution }
      );
      await redisClientPool.runForcePipeline((pipeline) =>
        Promise.all([
          this.queueDb.deleteRecordList(campaignExecution.id, pipeline),
          campaignExecutionDb.finalise(campaignExecution.id, pipeline),
        ])
      );
      this.queueFinalised(campaignExecution.id);
      this.serviceManager.releaseJob(campaignExecution.id);
      return true;
    }
    this.logger.log(
      'debug',
      `Checking end state for ${campaignExecution.id} - all records requested, total in progress contacts ${totalInProgressContacts} (${activeContacts} active + ${queuedContacts} queued + ${pendingContacts} pending)`,
      { entity: campaignExecution }
    );
    return false;
  }
}
