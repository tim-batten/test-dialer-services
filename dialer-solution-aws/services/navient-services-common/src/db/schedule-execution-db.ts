import { RedisClientPool } from "./redis-client-pool";
import {
  PipelineInjection,
  RedisGenericJsonEntityDb,
} from "./redis-generic-json-entity-db";
import {
  ScheduleExecutionDefinition,
  ScheduleExecutionStatus,
} from "navient-common/lib/models/schedule-execution";
import { CampaignPacingDefinition } from "navient-common/lib/models/campaign";

import { ScheduleDefinition } from "navient-common/lib/models/schedule";
import { ChainableCommander } from "ioredis";

export class ScheduleExecutionDb extends RedisGenericJsonEntityDb<ScheduleExecutionDefinition> {
  scheduleLastOccurrencesKey: string;

  constructor(redisClientPool: RedisClientPool) {
    super(
      redisClientPool,
      ScheduleExecutionDefinition.ENTITY_TYPE,
      ScheduleExecutionDefinition.from
    );
    this.scheduleLastOccurrencesKey = redisClientPool.makeBaseRedisKey(
      "schedule_last_occurrences"
    );
  }

  public getExecutionIdByScheduleId(
    scheduleId: string,
    pipeline?: ChainableCommander
  ) {
    return this.entityRelationshipDb.getSingleRelationshipFor(
      scheduleId,
      ScheduleDefinition.ENTITY_TYPE,
      ScheduleExecutionDefinition.ENTITY_TYPE,
      pipeline
    );
  }

  public async getExecutionIdsByScheduleId(
    scheduleIds: string[],
    pipeline?: ChainableCommander
  ) {
    if (!scheduleIds.length) {
      return [];
    }
    const result = await this.entityRelationshipDb.getSingleRelationshipsFor(
      scheduleIds,
      ScheduleDefinition.ENTITY_TYPE,
      ScheduleExecutionDefinition.ENTITY_TYPE,
      false,
      pipeline
    );
    return result
      .filter((scheduleExecId) => scheduleExecId)
      .map((scheduleExecId, index) => {
        return {
          scheduleExecutionId: scheduleExecId as string,
          scheduleId: scheduleIds[index],
        };
      });
  }

  public async getExecutionByScheduleId(
    scheduleId: string,
    occurrenceDate?: string,
    pipeline?: ChainableCommander
  ) {
    const executionId = await this.getExecutionIdByScheduleId(
      scheduleId,
      pipeline
    );
    if (!executionId || scheduleId.trim().length === 0) {
      return null;
    }
    const scheduleExec = await this.get(executionId);
    if (!scheduleExec) {
      return;
    }
    if (occurrenceDate && scheduleExec.getOccurrenceDate() !== occurrenceDate) {
      return;
    }
    return scheduleExec;
  }

  public async getExecutionsByScheduleId(
    scheduleIds: string[],
    pipeline?: ChainableCommander
  ) {
    const scheduleAndExecIds = await this.getExecutionIdsByScheduleId(
      scheduleIds,
      pipeline
    );
    const execs = await this.mgetList(
      scheduleAndExecIds.map(
        (scheduleAndExecId) => scheduleAndExecId.scheduleExecutionId
      )
    );
    const toReturn = new Map<string, ScheduleExecutionDefinition>();
    execs.forEach((exec) => {
      if (exec && exec.schedule) {
        toReturn.set(exec.schedule.id, exec);
      }
    });
    return toReturn;
  }

  public async getCurrentExecutionIds(
    pipeline?: ChainableCommander
  ): Promise<string[]> {
    const allExecutions =
      await this.entityRelationshipDb.getAllSingleRelationshipsBetween(
        ScheduleDefinition.ENTITY_TYPE,
        ScheduleExecutionDefinition.ENTITY_TYPE,
        pipeline
      );
    if (allExecutions === null) {
      return [];
    }
    return Object.values(allExecutions);
  }

  public async getAllExecutions(pipeline?: ChainableCommander) {
    const executionIds = await this.getCurrentExecutionIds(pipeline);
    return await this.mgetList(executionIds);
  }

  updateStatus(
    scheduleExec: ScheduleExecutionDefinition,
    status: ScheduleExecutionStatus
  ) {
    scheduleExec.status = status;
    return this.jsonUpdate(
      scheduleExec.id,
      ".status",
      `"${scheduleExec.status}"`
    );
  }

  updatePacing(
    scheduleExec: ScheduleExecutionDefinition,
    pacing: Required<CampaignPacingDefinition>,
    pipeline?: ChainableCommander
  ) {
    scheduleExec.currentPacing = pacing;
    return this.jsonUpdate(scheduleExec.id, ".currentPacing", JSON.stringify(pacing.toPlain()), pipeline);
  }

  updateCampaignWeight(
    scheduleExec: ScheduleExecutionDefinition,
    weight: number,
    pipeline?: ChainableCommander
  ) {
    scheduleExec.campaign.BaseConfig.Weight = weight;
    return this.jsonUpdate(
      scheduleExec.id,
      ".campaign.BaseConfig.Weight",
      "" + weight,
      pipeline
    );
  }

  updateDuration(
    scheduleExec: ScheduleExecutionDefinition,
    duration: number,
    pipeline?: ChainableCommander
  ) {
    scheduleExec.schedule.Occurrence.Duration = duration;
    return this.jsonUpdate(
      scheduleExec.id,
      ".schedule.Occurrence.Duration",
      "" + duration,
      pipeline
    );
  }

  updateRunState(scheduleExec: ScheduleExecutionDefinition) {
    return this.jsonUpdate(
      scheduleExec.id,
      ".runState",
      JSON.stringify(scheduleExec.runState.toPlain())
    );
  }

  public async setStatsFromTime(
    scheduleExecution: ScheduleExecutionDefinition,
    statsFromTime: Date
  ) {
    await this.redisClientPool.run((redisClient) => {
      return redisClient.call(
        "JSON.SET",
        scheduleExecution.id,
        ".statsFromTime",
        "" + statsFromTime.getTime()
      );
    });
    scheduleExecution.statsFromTime = statsFromTime;
  }

  async getLastExecOccurrences(scheduleIds: string[], pipeline?: ChainableCommander) {
    if (!scheduleIds.length) {
      return {};
    }
    const scheduleLastOccurrencesList = await this.redisClientPool.hmget(this.scheduleLastOccurrencesKey, scheduleIds, pipeline)
    const scheduleLastOccurrences: { [scheduleId: string]: string } =
      scheduleIds.reduce(
        (map, scheduleId, index) => ({
          ...map,
          [scheduleId]: scheduleLastOccurrencesList[index],
        }),
        {}
      );
    return scheduleLastOccurrences;
  }

  async setLastExecOccurrence(scheduleId: string, occurrenceDate: string) {
    return this.redisClientPool.run((redisClient) => {
      return redisClient.hset(
        this.scheduleLastOccurrencesKey,
        scheduleId,
        occurrenceDate
      );
    });
  }
}
