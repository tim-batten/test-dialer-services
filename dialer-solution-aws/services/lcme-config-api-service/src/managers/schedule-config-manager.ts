import { ScheduleDefinition } from "lcme-common/lib/models/schedule";
import { GenericEntityManager } from "./generic-entity-manager";
import { Logger } from "lcme-services-common/lib/logger/logger";
import {
  campaignConfigDb,
  campaignExecutionDb,
  holidayDb,
  redisClientPool,
  scheduleConfigDb,
  scheduleExecutionDb,
  scheduleUpdatePublisherDb,
} from "../globals";
import { IANAZone } from "luxon";
import { serviceConfig } from "../config/config";
import { getISODateString } from "lcme-common/lib/utils/date-helper";

export type scheduleConfigEvent = {
  action: "CREATE" | "UPDATE" | "DELETE";
  // Really this should go back to being a ScheduleDefinition but it needs to be made plain
  // using toPlain before being sent to the channel publisher (which shouldn't be schedule specific)
  schedule: any;
};
export class ScheduleConfigManager extends GenericEntityManager<ScheduleDefinition> {
  protected readonly logger: Logger = Logger.getLogger();

  constructor() {
    super(scheduleConfigDb);
  }

  public async getActiveSchedules() {
    const now = new Date();
    const [allSchedules, allHolidays] = await redisClientPool.runForcePipeline((pipeline) =>
      Promise.all([this.getAll(pipeline), holidayDb.getAllAsRecurrenceDateExclusions(pipeline)])
    );
    return Object.values(allSchedules).filter((schedule: ScheduleDefinition) => schedule.isRunningAt(now, allHolidays));
  }

  public async getScheduleIntendedRunningStatesAt(datetime: Date) {
    const [allSchedules, allHolidays] = await redisClientPool.runForcePipeline((pipeline) =>
      Promise.all([this.getAll(pipeline), holidayDb.getAllAsRecurrenceDateExclusions(pipeline)])
    );
    return Object.values(allSchedules).map((schedule) => {
      const runningTime = schedule.getRunningTimeAt(datetime, allHolidays);
      return {
        schedule,
        shouldBeRunning: runningTime ? true : false,
        runningTime: runningTime ? runningTime : undefined,
      };
    });
  }

  public async getAllExecutingBetween(start: Date, end: Date, inputTZ?: IANAZone) {
    const [allSchedules, holidays] = await redisClientPool.runForcePipeline((pipeline) =>
      Promise.all([
        this.getAll(pipeline),
        holidayDb.getAllTimesBetween(start, end, { inputTimezone: inputTZ }, pipeline),
      ])
    );
    return {
      schedules: Object.values(allSchedules)
        .map((schedule) => {
          return {
            schedule,
            times: schedule.getTimesBetween(
              start,
              end,
              holidays.map((holiday) => holiday.holiday.toRecurrenceDateExclusion()),
              { inputTimezone: inputTZ }
            ),
          };
        })
        .filter((schedule) => schedule.times.length > 0),
      holidays,
    };
  }

  async splitOccurrence(
    recurringToSplitFrom: ScheduleDefinition,
    occurrenceDateToReplace: string,
    occurrence: ScheduleDefinition
  ) {
    if (!recurringToSplitFrom.Occurrence.Recurring) {
      throw {
        status: 400,
        messaage: "Can only convert series to single occurrence",
      };
    }
    if (occurrence.Occurrence.Single) {
      occurrence.Occurrence.Single.Parent = recurringToSplitFrom.id;
    }
    recurringToSplitFrom.Occurrence.Recurring.setOccurrenceDisabledState(true, occurrenceDateToReplace);
    await this.checkScheduleConflicts(recurringToSplitFrom, occurrence);
    const toReturn = await super.add(occurrence);
    recurringToSplitFrom.Occurrence.Recurring.setOccurrenceDisabledState(false, occurrenceDateToReplace);
    recurringToSplitFrom.Occurrence.Recurring.Exclusions.push({
      Date: occurrenceDateToReplace,
      OccurrenceId: toReturn.id,
    });
    await super.update(recurringToSplitFrom);
    const updateEvent: scheduleConfigEvent = {
      action: "UPDATE",
      schedule: recurringToSplitFrom.toPlain(),
    };
    const createEvent: scheduleConfigEvent = {
      action: "CREATE",
      schedule: occurrence.toPlain(),
    };
    await redisClientPool.runForcePipeline((pipeline) =>
      Promise.all([
        scheduleUpdatePublisherDb.publishToChannel(updateEvent, pipeline),
        scheduleUpdatePublisherDb.publishToChannel(createEvent, pipeline),
      ])
    );
    return toReturn;
  }

  async add(schedule: ScheduleDefinition) {
    await this.checkScheduleConflicts(schedule);
    const addAndPublishSchedule = await super.add(schedule);

    const publishedEvent: scheduleConfigEvent = {
      action: "CREATE",
      schedule: schedule.toPlain(),
    };
    await scheduleUpdatePublisherDb.publishToChannel(publishedEvent);

    return addAndPublishSchedule;
  }

  async update(schedule: ScheduleDefinition) {
    await this.checkScheduleConflicts(schedule);

    const updateAndPublishSchedule = await super.update(schedule);

    const publishedEvent: scheduleConfigEvent = {
      action: "UPDATE",
      schedule: schedule.toPlain(),
    };
    await scheduleUpdatePublisherDb.publishToChannel(publishedEvent);

    return updateAndPublishSchedule;
  }

  async remove(schedule: ScheduleDefinition) {
    const removeAndPublishSchedule = await super.remove(schedule);

    const publishedEvent: scheduleConfigEvent = {
      action: "DELETE",
      schedule: schedule.toPlain(),
    };
    await scheduleUpdatePublisherDb.publishToChannel(publishedEvent);

    return removeAndPublishSchedule;
  }

  public async checkScheduleConflicts(
    thisSchedule: ScheduleDefinition,
    ...additionalSchedulesToCheckAgainst: ScheduleDefinition[]
  ) {
    const checkRange = serviceConfig.schedule.scheduleOverlapCheckRange;
    if (checkRange <= 0) {
      this.logger.log("verbose", `Checking schedule conficts disabled`, { entity: thisSchedule });
      return;
    }
    let scheduleIdsOnCampaign = await campaignConfigDb.getRelatedEntitiesOfType(
      thisSchedule.CampaignId,
      ScheduleDefinition.ENTITY_TYPE,
      {
        filterNull: true,
      }
    );
    if (scheduleIdsOnCampaign === undefined || scheduleIdsOnCampaign.length === 0) {
      this.logger.log("verbose", `Checking schedule conficts - no other schedules use the same campaign`, {
        entity: thisSchedule,
      });
      return;
    }
    const scheduleCheckStartDate = thisSchedule.Occurrence.getOccurrence().getStartDate();
    let scheduleCheckEndDate = new Date(
      scheduleCheckStartDate.getTime() + serviceConfig.schedule.scheduleOverlapCheckRange * 86400000
    );
    this.logger.log(
      "verbose",
      `Checking schedule conficts between ${scheduleCheckStartDate} and ${scheduleCheckEndDate} based on schedule check range of ${checkRange}`,
      { entity: thisSchedule }
    );
    let [otherSchedules, holidays] = await redisClientPool.runForcePipeline((pipeline) =>
      Promise.all([
        scheduleConfigDb.mgetList(scheduleIdsOnCampaign as string[], pipeline),
        holidayDb.getAllTimesBetween(scheduleCheckStartDate, scheduleCheckEndDate, undefined, pipeline),
      ])
    );
    otherSchedules = [...otherSchedules, ...additionalSchedulesToCheckAgainst];
    if (thisSchedule.id) {
      const thisScheduleIdx = otherSchedules.findIndex((schedule) => schedule.id === thisSchedule.id);
      if (thisScheduleIdx >= 0) {
        otherSchedules.splice(thisScheduleIdx, 1);
      }
    }
    const holidayRecurrenceDateExclusions = holidays.map((holiday) => holiday.holiday.toRecurrenceDateExclusion());
    const thisScheduleOccurrences = thisSchedule.getTimesBetween(
      scheduleCheckStartDate,
      scheduleCheckEndDate,
      holidayRecurrenceDateExclusions,
      {},
      false
    );
    if (thisScheduleOccurrences.length === 0) {
      this.logger.log(
        "verbose",
        `Checking schedule conficts - schedule has 0 occurrences in ${checkRange} days after start date`,
        { entity: thisSchedule }
      );
      return;
    }
    if (this.logger.isLoggable("verbose")) {
      this.logger.mlog("verbose", [
        "Checking schedule conflicts for schedule",
        thisSchedule.id || "<schedule id not yet created>",
        "against",
        otherSchedules.map((schedule) => schedule.id),
      ]);
    }
    const thisScheduleLastOccurrence = thisScheduleOccurrences[thisScheduleOccurrences.length - 1];
    scheduleCheckEndDate = thisScheduleLastOccurrence.end;
    const checksPerSchedule = thisScheduleOccurrences.length * checkRange;
    this.logger.log(
      "verbose",
      `Schedule conflict check: Checking ${thisScheduleOccurrences.length} occurrences against ${
        otherSchedules.length
      } other schedules on the same campaign, could check up to ${checksPerSchedule} occurrence combinations per schedule for a total of ${
        checksPerSchedule * otherSchedules.length
      } checks`
    );
    let checksPerformed = 0;
    for (const otherSchedule of otherSchedules) {
      const timesBetween = otherSchedule.getTimesBetween(
        scheduleCheckStartDate,
        scheduleCheckEndDate,
        holidayRecurrenceDateExclusions,
        {},
        false
      );
      for (const otherScheduleOccurrence of timesBetween) {
        for (const thisScheduleOccurrence of thisScheduleOccurrences) {
          checksPerformed++;
          if (
            (otherScheduleOccurrence.start >= thisScheduleOccurrence.start &&
              otherScheduleOccurrence.start <= thisScheduleOccurrence.end) ||
            (otherScheduleOccurrence.end <= thisScheduleOccurrence.end &&
              otherScheduleOccurrence.end >= thisScheduleOccurrence.start) ||
            (thisScheduleOccurrence.start >= otherScheduleOccurrence.start &&
              thisScheduleOccurrence.start <= otherScheduleOccurrence.end) ||
            (thisScheduleOccurrence.end <= otherScheduleOccurrence.end &&
              thisScheduleOccurrence.end >= otherScheduleOccurrence.start)
          ) {
            const conflictingOccurrence = getISODateString(
              otherScheduleOccurrence.end,
              otherSchedule.Occurrence.getTZID()
            );
            this.logger.log(
              "verbose",
              `Schedule conflict found between ${thisSchedule.id || "<schedule id not yet created>"} and ${
                otherSchedule.id
              } on occurrence date ${conflictingOccurrence} after ${checksPerformed} combination checks`,
              { entity: thisSchedule }
            );
            this.logger.log(
              "debug",
              `This occurrence start: ${thisScheduleOccurrence.start}, end: ${thisScheduleOccurrence.end} - conflicting schedule occurrence start: ${otherScheduleOccurrence.start} end: ${otherScheduleOccurrence.end}`,
              { entity: thisSchedule }
            );
            throw {
              status: 409,
              conflictingScheduleId: otherSchedule.id,
              conflictingOccurrence,
              checksPerformed,
            };
          }
        }
      }
    }
    this.logger.log("verbose", `No conflicts checked after ${checksPerformed} occurrence combinations checked`, {
      entity: thisSchedule,
    });
  }

  public async getDependents(entityDefinition: ScheduleDefinition) {
    const scheduleExecution = await scheduleExecutionDb.getExecutionByScheduleId(entityDefinition.id);
    if (!scheduleExecution) {
      return;
    }
    return {
      cascadeDeletable: false,
      dependents: {
        scheduleExecution: {
          id: scheduleExecution.id,
        },
      },
    };
  }
}
