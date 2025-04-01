import chalk from 'chalk';
import { CampaignConfigDb } from 'navient-services-common/lib/db/campaign-config-db';
import { CampaignExecutionDb } from 'navient-services-common/lib/db/campaign-execution-db';
import { ContactListConfigDb } from 'navient-services-common/lib/db/contact-list-config-db';
import { FilterConfigDb } from 'navient-services-common/lib/db/filter-config-db';
import { GlobalConfigDb } from 'navient-services-common/lib/db/global-config-db';
import { PacingStatsDb } from 'navient-services-common/lib/db/pacing-stats-db';
import { QueueDb } from 'navient-services-common/lib/db/queue-db';
import { RedisClientPool } from 'navient-services-common/lib/db/redis-client-pool';
import { ScheduleExecutionDb } from 'navient-services-common/lib/db/schedule-execution-db';
import { ScheduleControl, ScheduleControlAction } from 'navient-services-common/lib/events/schedule-control';
import { Logger } from 'navient-services-common/lib/logger/logger';
import { CampaignDefinition, CampaignPacingDefinition } from 'navient-common/lib/models/campaign';
import {
  CampaignExecutionDefinition,
  CampaignExecutionFilterDefinition,
  CampaignExecutionSortDefinition,
} from 'navient-common/lib/models/campaign-execution';
import { ContactListDefinition } from 'navient-common/lib/models/contact-list';
import { GlobalConfigDefinition } from 'navient-common/lib/models/global-config';
import { ScheduleDefinition, ScheduleSequenceDefinition } from 'navient-common/lib/models/schedule';
import {
  ScheduleExecutionDefinition,
  ScheduleExecutionFilterDefinition,
  ScheduleExecutionStatus,
} from 'navient-common/lib/models/schedule-execution';
import { RequestClient } from 'navient-services-common/lib/requests/request-client';
import { clearStatsForCampaign } from 'navient-services-common/lib/utils/campaign-stats-helper';
import { getISODateString } from 'navient-common/lib/utils/date-helper';
import { serviceConfig } from './config/config';
import { CampaignControlStreamPublisher } from './db/campaign-control-stream-publisher';
import { CampaignEventStreamMonitor } from './db/campaign-event-stream-monitor';
import { ScheduleControlStreamMonitor } from './db/schedule-control-stream-monitor';
import { ScheduleRunTime } from './schedule-manager';
import { ConnectInstanceServiceManager } from 'navient-services-common/lib/utils/connect-helper';
import { DescribeQueueCommand } from '@aws-sdk/client-connect';
import { ContactInfoDb } from 'navient-services-common/lib/db/contact-info-db';
import { HistoricalStats } from 'navient-common/lib/types/stats/historical-stats';
import { HistoricalStatsDb } from 'navient-services-common/lib/db/historical-stats-db';

type CampaignExecutionDependencies = {
  clFilters: CampaignExecutionFilterDefinition[];
  pndFilters: CampaignExecutionFilterDefinition[];
  clSorts: CampaignExecutionSortDefinition[];
};

type ScheduleExecutionDependencies = {
  campaign: CampaignDefinition;
  contactList: ContactListDefinition;
  global: GlobalConfigDefinition;
  filterDefs: ScheduleExecutionFilterDefinition[];
  queueName?: string;
};

export class ScheduleExecutionRequest {
  readonly CRUD_Action = 'subProcedure';
  readonly procedureAction = 'create';
  readonly appID = 'WTI_scheduleSvc';

  constructor(
    public readonly appNameId: number,
    public readonly redisKey: any,
    public readonly eventType: string,
    public readonly reason?: string
  ) {}
}

export class ScheduleExecutionManager {
  protected readonly logger: Logger = Logger.getLogger();
  private redisClientPool: RedisClientPool;
  private scheduleExecutionDb: ScheduleExecutionDb;
  private campaignExecutionDb: CampaignExecutionDb;
  private campaignControlStream: CampaignControlStreamPublisher;
  private campaignConfigDb: CampaignConfigDb;
  private contactListConfigDb: ContactListConfigDb;
  private filterConfigDb: FilterConfigDb;
  private globalConfigDb: GlobalConfigDb;
  private historicalStatsDb: HistoricalStatsDb;
  private statsDb: PacingStatsDb;
  private queueDb: QueueDb;
  private campaignEventMonitor: CampaignEventStreamMonitor;
  private scheduleControlMonitor: ScheduleControlStreamMonitor;
  navientCrudClient: RequestClient;

  constructor(redisClientPool: RedisClientPool) {
    this.redisClientPool = redisClientPool;
    this.scheduleExecutionDb = new ScheduleExecutionDb(redisClientPool);
    this.campaignExecutionDb = new CampaignExecutionDb(redisClientPool);
    this.campaignControlStream = new CampaignControlStreamPublisher(redisClientPool);
    this.campaignConfigDb = new CampaignConfigDb(redisClientPool);
    this.contactListConfigDb = new ContactListConfigDb(redisClientPool);
    this.filterConfigDb = new FilterConfigDb(redisClientPool);
    this.globalConfigDb = new GlobalConfigDb(redisClientPool);
    this.historicalStatsDb = new HistoricalStatsDb(redisClientPool);
    this.statsDb = new PacingStatsDb(redisClientPool);
    this.queueDb = new QueueDb(redisClientPool);
    this.campaignEventMonitor = new CampaignEventStreamMonitor(redisClientPool, this);
    this.campaignEventMonitor.start(serviceConfig.campaignEventMonitor.consumerId);
    this.scheduleControlMonitor = new ScheduleControlStreamMonitor(redisClientPool, this);
    this.scheduleControlMonitor.start(serviceConfig.scheduleControlMonitor.consumerId);
    this.navientCrudClient = new RequestClient(serviceConfig.crudApi.crudApiUrl);
  }

  //This is a temporary method to help clean up the services when they start up. This has to be initiated by the schedule service
  //but the other services need to process the events and handle them approrpiately (they could still be running, and the campaign
  //manager is the only one capable of releasing cache, for example)
  public async stopOldExecutions() {
    if (serviceConfig.dev.clearLastOccurrenceDatesOnStart) {
      this.logger.log('info', 'Clearing last occurrence dates');
      await this.redisClientPool.run((redisClient) => {
        return redisClient.del(this.scheduleExecutionDb.scheduleLastOccurrencesKey);
      });
    }
    if (serviceConfig.dev.clearExecutionsOnStart) {
      this.logger.log('info', 'Clearing old executions');
      const removedCampaignExecutions = await this.campaignExecutionDb.removeAll();
      const removedScheduleExecutions = await this.scheduleExecutionDb.removeAll();
      this.logger.log(
        'info',
        `Removed ${removedCampaignExecutions} campaign executions and ${removedScheduleExecutions} schedule executions`
      );
    }

    const now = new Date();

    const allCampaignExecs = await this.campaignExecutionDb.getAllAsList();
    for (const campaignExec of allCampaignExecs) {
      if (campaignExec.shouldBeFinishedAt(now)) {
        this.logger.log('info', chalk.red(`Stopping campaign execution ${campaignExec.id}`), { entity: campaignExec });
        await this.campaignControlStream.stopCampaign(campaignExec.id, true);
      }
    }
    const scheduleExecutions = await this.scheduleExecutionDb.getAllAsList();
    for (const scheduleExecution of scheduleExecutions) {
      if (scheduleExecution.shouldBeFinishedAt(now)) {
        this.logger.log('info', chalk.red(`Ending schedule execution ${scheduleExecution.id}`), {
          entity: scheduleExecution,
        });
        await this.scheduleExecutionFinished(scheduleExecution);
      }
    }
  }

  async startScheduleExecution(
    scheduleDefinition: ScheduleDefinition,
    scheduleOccurrenceStartTime: Date,
    scheduleOccurrenceEndTime: Date
  ) {
    const scheduleOccurrenceDate = getISODateString(
      scheduleOccurrenceStartTime,
      scheduleDefinition.Occurrence.getTZID()
    );
    const existingScheduleExec = await this.scheduleExecutionDb.getExecutionByScheduleId(
      scheduleDefinition.id,
      scheduleOccurrenceDate
    );
    if (existingScheduleExec && existingScheduleExec.getOccurrenceDate() === scheduleOccurrenceDate) {
      throw new Error(`Schedule ${scheduleDefinition.id} is already running`);
    }

    let scheduleExecDependencies;
    try {
      scheduleExecDependencies = await this.getScheduleExecutionDependencies(scheduleDefinition);
    } catch (e) {
      this.logger.log('error', `Failed to get schedule dependencies ${e}`, {
        entityId: [scheduleDefinition.id],
      });
      return;
    }

    let contactFlowId = scheduleExecDependencies.campaign.BaseConfig.ContactFlowOverride;
    if (!contactFlowId || contactFlowId.trim().length === 0) {
      contactFlowId = scheduleExecDependencies.global.DialerDefaults.ContactFlowId;
    }

    const scheduleExecution = ScheduleExecutionDefinition.build(
      scheduleDefinition,
      scheduleExecDependencies.campaign,
      scheduleExecDependencies.contactList,
      scheduleExecDependencies.filterDefs,
      scheduleExecDependencies.queueName,
      contactFlowId,
      scheduleExecDependencies.global.DialerDefaults.MaxCPA,
      new Date(),
      scheduleOccurrenceStartTime,
      scheduleOccurrenceEndTime
    );
    const expireTime =
      scheduleExecution.generateExpireTimeSecondsAt(Date.now()) + serviceConfig.scheduleExecutionExpiryOffset;
    await this.scheduleExecutionDb
      .add(scheduleExecution, (pipeline) => {
        this.logger.log(
          'info',
          `Setting schedule execution expire time to ${expireTime} seconds, scheduleExecutionExpiryOffset is ${serviceConfig.scheduleExecutionExpiryOffset}`,
          { entity: scheduleExecution }
        );
        this.scheduleExecutionDb.expire(scheduleExecution.id, expireTime, pipeline);
      })
      .catch((e) => {
        this.logger.mlog('error', ['Unexpected error when adding schedule execution', e]);
        this.stopScheduleExecution(scheduleExecution);
        this.scheduleExecutionFinished(scheduleExecution);
        return;
      });
    this.logger.log('debug', 'Successfully added schedule execution', {
      entity: scheduleExecution,
    });

    this.sendScheduleExecutionToCrudApi(scheduleExecution, 'CREATED');
    await this.historicalStatsDb.clearContactStatsForCampaign(scheduleExecution.campaign);
    await this.executeNextCampaign(scheduleExecution, true);
  }

  async sendScheduleExecutionToCrudApi(
    scheduleExecution: ScheduleExecutionDefinition,
    eventType: string,
    message?: string
  ) {
    try {
      const scheduleExecutionRequest = new ScheduleExecutionRequest(
        serviceConfig.scheduleServiceAppNameID,
        scheduleExecution.toPlain(),
        eventType
      );
      if (this.logger.isLoggable('debug')) {
        this.logger.log('debug', `Sending schedule exec info to CRUD: ${JSON.stringify(scheduleExecutionRequest)}`, {
          entity: scheduleExecution,
        });
      }
      if (serviceConfig.dev.skipSendScheduleExecStatus) {
        this.logger.log(
          'info',
          `Skipping sending schedule exec info to CRUD as skipSendScheduleExecStatus dev flag set`,
          {
            entity: scheduleExecution,
          }
        );
        return;
      }
      const headers = {
        'Content-Type': 'application/json-patch+json',
        accept: 'text/plain',
      };
      const https = serviceConfig.apiCertificate.getHttpsOptions();
      await this.navientCrudClient.post(scheduleExecutionRequest, headers, https);
    } catch (e) {
      this.logger.mlog('error', ['Unable to send schedule execution info to CRUD API', e], {
        entity: scheduleExecution,
      });
    }
  }

  async stopScheduleExecution(scheduleExecution: ScheduleExecutionDefinition) {
    const { currentCampaignExecutionId } = scheduleExecution.runState;
    if (!currentCampaignExecutionId) {
      this.logger.log('info', 'Schedule was running but no campaign currently executing', {
        entity: scheduleExecution,
      });
      return;
    }
    this.logger.log(
      'info',
      chalk.blue(
        `Stopping schedule sequence ${scheduleExecution.runState.currentSequenceIndex} with exec id ${currentCampaignExecutionId}`
      ),
      { entity: scheduleExecution }
    );
    this.campaignControlStream.stopCampaign(currentCampaignExecutionId);
  }

  private async scheduleExecutionFinished(scheduleExecution: ScheduleExecutionDefinition) {
    await this.scheduleExecutionDb.remove(scheduleExecution.id);
    this.sendScheduleExecutionToCrudApi(scheduleExecution, 'FINISHED');
    for (const campaignExecutionId of scheduleExecution.runState.campaignExecutionIds) {
      const campaignExecution = await this.campaignExecutionDb.get(campaignExecutionId);
      if (!campaignExecution) {
        continue;
      }
      if (campaignExecution.finalised) {
        this.logger.log('verbose', `Campaign execution ${campaignExecution.id} is finalised, removing`, {
          entity: scheduleExecution,
        });
        await this.campaignExecutionDb.remove(campaignExecution.id);
      } else {
        this.logger.log('info', `Cannot remove campaign execution ${campaignExecution.id} as it is not yet finalised`, {
          entity: scheduleExecution,
        });
      }
    }
  }

  private async executeNextCampaign(
    scheduleExecution: ScheduleExecutionDefinition,
    forceClearStats: boolean
  ): Promise<CampaignExecutionDefinition | undefined> {
    try {
      const nextSequence = scheduleExecution.getNextSequence();
      if (!nextSequence) {
        this.logger.log('info', `Schedule execution ${scheduleExecution.id} complete!`, { entity: scheduleExecution });
        this.scheduleExecutionFinished(scheduleExecution);
        return;
      }
      if (nextSequence.Pacing && nextSequence.Pacing.ClearStats) {
        // Do this first - that way even if sequence fails, its pacing overrides which carry into the
        // next sequence aren't lost
        this.logger.log(
          'info',
          `Sequence indicates clear stats; ${
            nextSequence.Pacing.PacingOverride ? "setting new sequence's" : 'resetting'
          } pacing`,
          { entity: scheduleExecution }
        );
        const newPacing = scheduleExecution.generatePacing(nextSequence.Pacing.PacingOverride);
        await this.scheduleExecutionDb.updatePacing(scheduleExecution, newPacing);
      }
      const clearStats = forceClearStats === true ? true : nextSequence.isClearPacingStats();
      let campaignExecDependencies;
      try {
        campaignExecDependencies = this.getCampaignExecutionDependencies(scheduleExecution, nextSequence);
      } catch (e) {
        // TODO: Retry logic
        const message = `Failed to get campaign dependencies ${e}`;
        this.logger.log('info', message, {
          entityId: [scheduleExecution.schedule.id, scheduleExecution.id],
        });
        this.sendScheduleExecutionToCrudApi(scheduleExecution, 'SEQUENCE_FAILED', message);
        return this.executeNextCampaign(scheduleExecution, clearStats);
      }
      if (!campaignExecDependencies) {
        this.sendScheduleExecutionToCrudApi(
          scheduleExecution,
          'SEQUENCE_FAILED',
          'Could not build campaign exec dependencies'
        );
        return this.executeNextCampaign(scheduleExecution, clearStats);
      }
      if (clearStats) {
        // The campaign manager should clear the stats but this is just there to ensure it definitely happens
        // in case a camapign marked as "complete" without ever getting records (which is when it clears stats)
        this.logger.log('info', 'Clearing pacing stats', {
          entityId: scheduleExecution.campaign.id,
        });
        await clearStatsForCampaign(
          scheduleExecution.campaign,
          this.statsDb
        ).catch((e) => {
          this.logger.mlog('error', ['Error clearing stats for campaign', e], {
            entity: scheduleExecution,
          });
        });
      }
      const campaignExecution = CampaignExecutionDefinition.build(
        scheduleExecution,
        nextSequence,
        campaignExecDependencies.clFilters,
        campaignExecDependencies.pndFilters,
        campaignExecDependencies.clSorts,
        clearStats
      );
      try {
        const expireTime =
          campaignExecution.generateExpireTimeSecondsAt(new Date()) + serviceConfig.campaignExecutionExpiryOffset;
        await this.campaignExecutionDb.add(campaignExecution, (pipeline) => {
          this.campaignExecutionDb.expire(campaignExecution.id, expireTime, pipeline);
        });
      } catch (e) {
        // TODO: Retry logic
        const message = `Failed to add campaign execution to DB ${e}`;
        this.logger.log('info', message, {
          entityId: [scheduleExecution.schedule.id, scheduleExecution.id, campaignExecution.id],
        });
        this.sendScheduleExecutionToCrudApi(scheduleExecution, 'SEQUENCE_FAILED', message);
        return this.executeNextCampaign(scheduleExecution, campaignExecution.clearStats);
      }
      scheduleExecution.runState.updateCampaignExecutionId(campaignExecution.id);
      await this.scheduleExecutionDb.updateRunState(scheduleExecution).catch((e) => {
        this.logger.mlog('error', ['Unable to update schedule run state', e], { entity: scheduleExecution });
      });
      this.sendScheduleExecutionToCrudApi(scheduleExecution, 'NEW_SEQUENCE');
      this.campaignControlStream.startCampaign(campaignExecution.id).catch((e) => {
        this.logger.mlog('error', ['Unable to send start campaign control event', e], { entity: scheduleExecution });
      });
      this.logger.log(
        'info',
        chalk.blue(
          `Starting schedule sequence ${scheduleExecution.runState.currentSequenceIndex} in loop ${
            scheduleExecution.runState.currentSequenceLoop + 1
          } of ${scheduleExecution.schedule.Loops} ${scheduleExecution.id} ${campaignExecution.id})`
        ),
        { entity: [scheduleExecution, campaignExecution] }
      );
      return campaignExecution;
    } catch (e) {
      this.sendScheduleExecutionToCrudApi(scheduleExecution, 'SEQUENCE_FAILED', `Unknown error occurred ${e}`);
      this.logger.log('error', e);
    }
  }

  async campaignExecutionComplete(campaignExecutionId: string, failed?: boolean) {
    const campaignExecution = await this.campaignExecutionDb.get(campaignExecutionId);
    if (!campaignExecution) {
      this.logger.log('info', `No campaign execution found for campaign execution id ${campaignExecutionId}`, {
        entity: campaignExecution,
      });
      return;
    }
    const scheduleExecution = await this.scheduleExecutionDb.get(campaignExecution.scheduleExecutionId);
    if (!scheduleExecution) {
      this.logger.log(
        'info',
        `No schedule execution found for schedule execution id ${campaignExecution.scheduleExecutionId}`,
        {
          entity: [campaignExecution],
        }
      );
      return;
    }
    // Update the stats from time so that cumulative stats fetched are from the last clear
    await this.scheduleExecutionDb.setStatsFromTime(scheduleExecution, campaignExecution.statsFromTime);
    const forceClearStats = failed === true ? campaignExecution.clearStats : false;
    this.executeNextCampaign(scheduleExecution, forceClearStats);
  }

  async campaignExecutionFinalised(campaignExecutionId: string) {
    try {
      await this.campaignExecutionDb.finalise(campaignExecutionId);
    } catch (e) {
      this.logger.log('info', 'Unable to finalise campaign; already deleted', {
        entityId: campaignExecutionId,
      });
      return;
    }

    const campaignExecution = await this.campaignExecutionDb.get(campaignExecutionId);
    if (!campaignExecution) {
      this.logger.log('info', `No campaign execution found for campaign execution id ${campaignExecutionId}`, {
        entity: campaignExecution,
      });
      return;
    }
    const scheduleExecution = await this.scheduleExecutionDb.get(campaignExecution.scheduleExecutionId);
    if (!scheduleExecution) {
      this.logger.log(
        'info',
        `Campaign execution ${campaignExecution.id} is finalised and schedule execution finished, removing camapign execution`,
        { entity: campaignExecution }
      );
      this.campaignExecutionDb.remove(campaignExecutionId);
    } else {
      this.logger.log(
        'info',
        `Cannot remove campaign execution ${campaignExecution.id} as schedule execution is still processing`,
        {
          entity: [scheduleExecution, campaignExecution],
        }
      );
    }
  }

  getCampaignExecutionDependencies(
    scheduleExection: ScheduleExecutionDefinition,
    sequence: ScheduleSequenceDefinition
  ) {
    const { ClFilters: clFiltersToFetch, PndFilters: pndFiltersToFetch, ClSorts: clSortsToFetch } = sequence.FilterSort;

    const clFilters = clFiltersToFetch.map((filterInfo) => {
      const filterData = scheduleExection.filterData.find((filter) => filter.id === filterInfo.FilterID);
      if (filterData) {
        return CampaignExecutionFilterDefinition.from(filterData);
      } else {
        throw `Missing cl filter dependency ${filterInfo.FilterID}`;
      }
    });
    const pndFilters = pndFiltersToFetch.map((filterInfo) => {
      const filterData = scheduleExection.filterData.find((filter) => filter.id === filterInfo.FilterID);
      if (filterData) {
        return CampaignExecutionFilterDefinition.from(filterData);
      } else {
        throw `Missing pnd filter dependency ${filterInfo.FilterID}`;
      }
    });
    const clSorts = clSortsToFetch.map((sortInfo) => {
      const filterData = scheduleExection.filterData.find((filter) => filter.id === sortInfo.OrderByID);
      if (filterData) {
        return CampaignExecutionSortDefinition.from(filterData, sortInfo.OrderByType);
      } else {
        throw `Missing cl sort dependency ${sortInfo.OrderByID}`;
      }
    });

    const toReturn: CampaignExecutionDependencies = {
      clFilters,
      pndFilters,
      clSorts,
    };

    return toReturn;
  }

  async getScheduleExecutionDependencies(scheduleDefinition: ScheduleDefinition) {
    const campaignId = scheduleDefinition.CampaignId;
    const [campaign, global, connectInstanceService] = await this.redisClientPool.runForcePipeline((pipeline) => {
      return Promise.all([
        this.campaignConfigDb.get(campaignId, pipeline),
        this.globalConfigDb.get(pipeline),
        ConnectInstanceServiceManager.getInstance().get(pipeline),
      ]);
    });

    if (!campaign) {
      throw `Campaign ${campaignId} does not exist`;
    }

    if (!global) {
      throw 'Could not fetch global config';
    }

    if (!connectInstanceService) {
      throw 'Could not fetch connect config';
    }

    const contactListId = campaign.BaseConfig.ContactListConfigID;

    const filterIdsToFetch = scheduleDefinition.getAllFilterIds();

    const [contactList, filters, queueInfo] = await this.redisClientPool.runForcePipeline((pipeline) => {
      return Promise.all([
        this.contactListConfigDb.get(contactListId, pipeline),
        this.filterConfigDb.mgetList(filterIdsToFetch, pipeline),
        campaign.BaseConfig.Queue
          ? connectInstanceService.connectClient.send(
              new DescribeQueueCommand({
                InstanceId: connectInstanceService.connectConfig.InstanceId,
                QueueId: campaign.BaseConfig.Queue,
              })
            )
          : undefined,
      ]);
    });

    if (!contactList) {
      throw `Could not fetch contact list ${contactListId}`;
    }

    if (!filters) {
      throw `Could not fetch all filters ${filterIdsToFetch}`;
    }

    const filterDefs = filters.map((filter) => ScheduleExecutionFilterDefinition.from(filter));

    const toReturn: ScheduleExecutionDependencies = {
      campaign,
      contactList,
      global,
      filterDefs,
      queueName: queueInfo?.Queue?.Name,
    };
    return toReturn;
  }

  async controlExecution(scheduleExecution: ScheduleExecutionDefinition, scheduleControl: ScheduleControl) {
    if (scheduleControl.action === ScheduleControlAction.PAUSE) {
      if (scheduleExecution.status === ScheduleExecutionStatus.STOPPING) {
        return;
      }
      await this.scheduleExecutionDb.updateStatus(scheduleExecution, ScheduleExecutionStatus.PAUSED);
      const campaignExecutionId = scheduleExecution.runState.currentCampaignExecutionId;
      if (campaignExecutionId) {
        this.campaignControlStream.pauseCampaign(campaignExecutionId);
      }
      this.sendScheduleExecutionToCrudApi(scheduleExecution, 'MANUAL_PAUSE');
    } else if (scheduleControl.action === ScheduleControlAction.RESUME) {
      if (scheduleExecution.status === ScheduleExecutionStatus.STOPPING) {
        return;
      }
      await this.scheduleExecutionDb.updateStatus(scheduleExecution, ScheduleExecutionStatus.RUNNING);
      const campaignExecutionId = scheduleExecution.runState.currentCampaignExecutionId;
      if (campaignExecutionId) {
        this.campaignControlStream.resumeCampaign(campaignExecutionId);
      }
      this.sendScheduleExecutionToCrudApi(scheduleExecution, 'MANUAL_RESUME');
    } else if (scheduleControl.action === ScheduleControlAction.STOP) {
      await this.scheduleExecutionDb.updateStatus(scheduleExecution, ScheduleExecutionStatus.STOPPING);
      const campaignExecutionId = scheduleExecution.runState.currentCampaignExecutionId;
      if (campaignExecutionId) {
        this.campaignControlStream.stopCampaign(campaignExecutionId);
      }
      this.sendScheduleExecutionToCrudApi(scheduleExecution, 'MANUAL_STOP');
    } else if (scheduleControl.action === ScheduleControlAction.SKIP_SEQUENCE) {
      const campaignExecutionId = scheduleExecution.runState.currentCampaignExecutionId;
      if (campaignExecutionId) {
        this.campaignControlStream.stopCampaign(campaignExecutionId);
      }
      this.sendScheduleExecutionToCrudApi(scheduleExecution, 'MANUAL_SKIP_SEQUENCE');
    } else if (scheduleControl.action === ScheduleControlAction.UPDATE_RUNTIME_PARAMETERS) {
      const runtimeParms = scheduleControl.runtimeParameters;
      if (!runtimeParms) {
        return;
      }
      const campaignExecutionId = scheduleExecution.runState.currentCampaignExecutionId;
      await this.redisClientPool.run((redisClient) => {
        const pipeline = redisClient.pipeline();
        if (runtimeParms.pacing) {
          const newPacing = {
            ...scheduleExecution.currentPacing,
            ...runtimeParms.pacing,
          };
          const newPacingTransformed = CampaignPacingDefinition.from(
            newPacing,
            scheduleExecution.campaign.BaseConfig.CallingMode
          ) as Required<CampaignPacingDefinition>;
          this.scheduleExecutionDb.updatePacing(scheduleExecution, newPacingTransformed, pipeline);
          if (campaignExecutionId) {
            this.campaignExecutionDb.updatePacing(campaignExecutionId, newPacingTransformed, pipeline);
          }
        }
        if (runtimeParms.weight) {
          this.scheduleExecutionDb.updateCampaignWeight(scheduleExecution, runtimeParms.weight, pipeline);
          if (campaignExecutionId) {
            this.campaignExecutionDb.updateWeight(campaignExecutionId, runtimeParms.weight, pipeline);
          }
        }
        if (runtimeParms.duration) {
          this.scheduleExecutionDb.updateDuration(scheduleExecution, runtimeParms.duration, pipeline);
          const expireTimeBase = scheduleExecution.generateExpireTimeSecondsAt(Date.now());
          const scheduleExpireTime = expireTimeBase + serviceConfig.scheduleExecutionExpiryOffset;
          this.scheduleExecutionDb.expire(scheduleExecution.id, scheduleExpireTime, pipeline);
          this.logger.log(
            'info',
            `Setting schedule execution expire time to ${scheduleExpireTime}, scheduleExecutionExpiryOffset is ${serviceConfig.scheduleExecutionExpiryOffset}`,
            { entity: scheduleExecution }
          );
          if (campaignExecutionId) {
            this.campaignExecutionDb.updateDuration(campaignExecutionId, runtimeParms.duration, pipeline);
            this.campaignExecutionDb.expire(
              campaignExecutionId,
              expireTimeBase + serviceConfig.campaignExecutionExpiryOffset,
              pipeline
            );
          }
        }
        return pipeline.exec();
      });
      if (runtimeParms.weight && campaignExecutionId) {
        this.queueDb.rescoreCampaign(campaignExecutionId, runtimeParms.weight);
      }
      this.sendScheduleExecutionToCrudApi(scheduleExecution, 'MANUAL_UPDATE_PARAMS');
    }
  }

  async handleControlEvent(scheduleControl: ScheduleControl) {
    this.logger.mlog('info', ['Handling schedule control event', scheduleControl], {
      entityId: [scheduleControl.scheduleId, scheduleControl.scheduleExecutionId],
    });
    if (scheduleControl.scheduleExecutionId) {
      const scheduleExecution = await this.scheduleExecutionDb.get(scheduleControl.scheduleExecutionId);
      if (!scheduleExecution) {
        this.logger.log(
          'info',
          `Could not find schedule execution for ${scheduleControl.scheduleExecutionId}, ignoring`,
          {
            entityId: scheduleControl.scheduleExecutionId,
          }
        );
        return;
      }
      this.controlExecution(scheduleExecution, scheduleControl);
    } else if (scheduleControl.scheduleId) {
      const scheduleExecution = await this.scheduleExecutionDb.getExecutionByScheduleId(
        scheduleControl.scheduleId,
        scheduleControl.occurrence
      );
      if (!scheduleExecution) {
        this.logger.log(
          'info',
          `Schedule control event recevied for schedule ${scheduleControl.scheduleId} but no executions running against that schedule; ignoring`,
          { entityId: scheduleControl.scheduleId }
        );
        return;
      }
      this.controlExecution(scheduleExecution, scheduleControl);
    }
  }

  async checkRunningStates(scheduleRunTimes: ScheduleRunTime[]) {
    const now = new Date();
    if (scheduleRunTimes.length === 0) {
      this.logger.log('debug', 'No schedules to run!');
      return;
    }
    const runningExecutions = await this.scheduleExecutionDb.getAllExecutions();
    const runningExecutionsByScheduleId = runningExecutions.reduce(
      (map: { [scheduleId: string]: ScheduleExecutionDefinition }, exec) => {
        map[exec.schedule.id] = exec;
        return map;
      },
      {}
    );
    const runningExecutionsByCampaignId = runningExecutions.reduce(
      (map: { [campaignId: string]: ScheduleExecutionDefinition }, exec) => {
        map[exec.campaign.id] = exec;
        return map;
      },
      {}
    );
    const campaignIds = new Set<string>();
    scheduleRunTimes = scheduleRunTimes.filter((scheduleRunTime) => {
      const campaignId = scheduleRunTime.schedule.CampaignId;
      if (campaignIds.has(campaignId)) {
        this.logger.log('info', `Detected multiple simultaenous schedules for same campaign ${campaignId}`, {
          entity: scheduleRunTime.schedule,
        });
        return false;
      }
      campaignIds.add(campaignId);
      return true;
    });
    const scheduleIds = scheduleRunTimes.map((scheduleRunTime) => scheduleRunTime.schedule.id);
    const scheduleLastOccurrences = await this.scheduleExecutionDb.getLastExecOccurrences(scheduleIds);
    for (const scheduleRunTime of scheduleRunTimes) {
      const schedule = scheduleRunTime.schedule;
      const occurrenceDate = getISODateString(scheduleRunTime.start, scheduleRunTime.schedule.Occurrence.getTZID());

      const scheduleExecForSchedule = runningExecutionsByScheduleId[schedule.id];
      if (scheduleExecForSchedule && scheduleExecForSchedule.getOccurrenceDate() === occurrenceDate) {
        this.logger.log('info', `Schedule execution for schedule ${schedule.id} is already running`, {
          entity: scheduleExecForSchedule,
        });
        continue;
      }
      const scheduleExecForCampaign = runningExecutionsByCampaignId[schedule.CampaignId];
      if (scheduleExecForCampaign && scheduleExecForCampaign.getOccurrenceDate() === occurrenceDate) {
        this.logger.log('info', `Schedule execution for campaign ${schedule.CampaignId} is already running`, {
          entity: scheduleExecForCampaign,
        });
        continue;
      }
      const scheduleLastOccurrenceDate = scheduleLastOccurrences[schedule.id];
      if (scheduleLastOccurrenceDate && scheduleLastOccurrenceDate === occurrenceDate) {
        this.logger.log('info', `Schedule ${schedule.id} has already occurred today, not running`);
        continue;
      }
      try {
        this.logger.log(
          'info',
          chalk.green(
            chalk.bold('Schedule Execution Manager:'),
            'Starting schedule',
            schedule.ScheduleName,
            'for campaign',
            schedule.CampaignId,
            'at',
            new Date()
          ),
          { entity: schedule }
        );
        await this.scheduleExecutionDb.setLastExecOccurrence(schedule.id, occurrenceDate);
        this.startScheduleExecution(schedule, scheduleRunTime.start, scheduleRunTime.end);
      } catch (error) {
        this.logger.mlog('error', [`Failed to start scheduleExecution\n\tscheduleId:${schedule.id}`, error], {
          entity: schedule,
        });
      }
    }
    runningExecutions.forEach((scheduleExecution) => {
      if (scheduleExecution.shouldBeFinishedAt(now)) {
        this.logger.log(
          'info',
          chalk.red(
            chalk.bold('Schedule Execution Manager:'),
            'Stopping schedule',
            scheduleExecution.schedule.ScheduleName,
            'for campaign',
            scheduleExecution.schedule.CampaignId,
            'at',
            new Date()
          ),
          { entity: scheduleExecution }
        );
        this.stopScheduleExecution(scheduleExecution);
      }
    });
  }
}
