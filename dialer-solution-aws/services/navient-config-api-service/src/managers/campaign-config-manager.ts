import { CampaignDefinition } from 'navient-common/lib/models/campaign';
import { GenericEntityManager } from './generic-entity-manager';
import { campaignConfigDb, redisClientPool, scheduleConfigDb, scheduleExecutionDb } from '../globals';
import { ScheduleExecutionDefinition } from 'navient-common/lib/models/schedule-execution';
import { ScheduleDefinition } from 'navient-common/lib/models/schedule';
import { globalConfigDb } from '../globals';

export class CampaignConfigManager extends GenericEntityManager<CampaignDefinition> {
  constructor() {
    super(campaignConfigDb);
  }

  public async getDependents(entityDefinition: CampaignDefinition) {
    const [dependentScheduleIds, dependentScheduleExecIds] = await redisClientPool.runForcePipeline((pipeline) =>
      Promise.all([
        campaignConfigDb.getRelatedEntitiesOfType(entityDefinition.id, ScheduleDefinition.ENTITY_TYPE, {
          filterNull: true,
          pipeline,
        }),
        campaignConfigDb.getRelatedEntitiesOfType(entityDefinition.id, ScheduleExecutionDefinition.ENTITY_TYPE, {
          filterNull: true,
          pipeline,
        }),
      ])
    );
    const [dependentSchedules, dependentScheduleExecutions] = await redisClientPool.runForcePipeline((pipeline) =>
      Promise.all([
        scheduleConfigDb.mgetList(dependentScheduleIds || [], pipeline),
        scheduleExecutionDb.mgetList(dependentScheduleExecIds || [], pipeline),
      ])
    );
    if (dependentSchedules.length === 0 && dependentScheduleExecutions.length === 0) {
      return;
    }
    return {
      cascadeDeletable: dependentScheduleExecutions.length === 0,
      dependents: {
        schedules: dependentSchedules.map((schedule) => {
          return {
            scheduleId: schedule.id,
            scheduleName: schedule.ScheduleName,
          };
        }),
        scheduleExecutions: dependentScheduleExecutions.map((scheduleExec) => {
          return {
            id: scheduleExec.id,
            scheduleId: scheduleExec.schedule.id,
          };
        }),
      },
    };
  }

  public async cascadeRemove(entityDefinition: CampaignDefinition) {
    const dependentsInfo = await this.getDependents(entityDefinition);
    if (dependentsInfo) {
      if (!dependentsInfo.cascadeDeletable) {
        return dependentsInfo;
      }
      if (dependentsInfo.dependents) {
        const dependentSchedules = dependentsInfo.dependents.schedules;
        if (dependentSchedules && dependentSchedules.length > 0) {
          const dependentScheduleIds = dependentSchedules.map((schedule) => schedule.scheduleId);
          await scheduleConfigDb.mremove(dependentScheduleIds);
        }
      }
    }
    await this.remove(entityDefinition);
  }

  public async additionalValidation(entityDefinition: CampaignDefinition) {
    if (entityDefinition.Pacing.MaxCPA) {
      const globalConfig = await globalConfigDb.get();
      const globalMaxCPA = globalConfig?.DialerDefaults.MaxCPA || 0;
      if (globalMaxCPA > 0 && entityDefinition.Pacing.MaxCPA > globalMaxCPA) {
        throw `MaxCPA of ${entityDefinition.Pacing.MaxCPA} is greater than the global max of ${globalConfig?.DialerDefaults.MaxCPA}`;
      }
    }
  }
}
