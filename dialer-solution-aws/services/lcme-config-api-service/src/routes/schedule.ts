import { ValidationError } from 'class-validator';
import { Request, Response, Router } from 'express';
import { DateTime, IANAZone } from 'luxon';
import { ScheduleDefinition } from 'lcme-common/lib/models/schedule';
import { dateToZone, ensureIANAZone, getISODateString, stringToDate } from 'lcme-common/lib/utils/date-helper';
import { ScheduleControl, ScheduleControlAction } from 'lcme-services-common/lib/events/schedule-control';
import { ScheduleApiResponse, ScheduleOccurrenceInfo } from 'lcme-common/lib/types/schedules-api';
import { Logger } from 'lcme-services-common/lib/logger/logger';
import { formatError } from 'lcme-services-common/lib/utils/error-helper';
import { makeAuth } from '../auth/auth';
import {
  campaignConfigDb,
  redisClientPool,
  scheduleControlStreamPublisher,
  scheduleExecutionDb,
  scheduleManager,
} from '../globals';
import { CrudAction, makeConfigRouter, sendErrorResponse } from './config-entity-route-builder';
import { ScheduleExecutionStatus } from 'lcme-common/lib/models/schedule-execution';

export function makeScheduleRouter(): Router {
  const logger = Logger.getLogger();
  const router = makeConfigRouter(scheduleManager, ScheduleDefinition.from, 'schedule', 'schedules');

  const updateAuth = makeAuth(CrudAction.UPDATE, ...scheduleManager.validUpdateRoles);

  router.get(
    '/schedules',
    makeAuth(CrudAction.READ, ...scheduleManager.validReadRoles),
    async (req: any, res: Response) => {
      const { startTime, endTime, status, inputTimezone, outputTimezone } = req.query;
      if (!startTime && !endTime && !status) {
        return res.status(400).send('Must specify a start and end time');
      }
      if (status) {
        if (status.toLowerCase() === 'running') {
          const schedules = await scheduleManager.getActiveSchedules();
          res.send(schedules);
          return;
        }
      }
      const inputTZ = inputTimezone ? new IANAZone(inputTimezone) : undefined;
      if (inputTZ && !inputTZ.isValid) {
        return res
          .status(400)
          .send(formatError(`Supplied input timezone '${inputTimezone}' is not a valid IANA timezone`));
      }
      const outputTZ = ensureIANAZone(outputTimezone);
      if (outputTZ && !outputTZ.isValid) {
        return res
          .status(400)
          .send(formatError(`Supplied output timezone '${outputTimezone}' is not a valid IANA timezone`));
      }
      const startTimeParsed = Date.parse(startTime);
      const endTimeParsed = Date.parse(endTime);
      if (isNaN(startTimeParsed)) {
        return res.status(400).send('Start time is invalid');
      }
      if (isNaN(endTimeParsed)) {
        return res.status(400).send('End time is invalid');
      }
      const now = new Date();
      const schedulesAndHolidays = await scheduleManager.getAllExecutingBetween(
        new Date(startTimeParsed),
        new Date(endTimeParsed),
        inputTZ
      );
      const schedulesExecutingBetween = schedulesAndHolidays.schedules;
      const scheduleIds = schedulesExecutingBetween.map((schedule) => schedule.schedule.id);
      const campaignIds = [
        ...new Set<string>(schedulesExecutingBetween.map((schedule) => schedule.schedule.CampaignId)),
      ];

      const [lastExecOccurrences, scheduleExecutions, campaignGroups] = await redisClientPool.runForcePipeline(
        (pipeline) =>
          Promise.all([
            scheduleExecutionDb.getLastExecOccurrences(scheduleIds, pipeline),
            scheduleExecutionDb.getExecutionsByScheduleId(scheduleIds, pipeline),
            campaignConfigDb.getGroupIds(campaignIds, pipeline),
          ])
      );
      const schedules = schedulesExecutingBetween.map((sched) => {
        const scheduleData = sched.schedule;
        const execution = scheduleExecutions.get(scheduleData.id);
        const execOccurrenceDate = execution ? execution.getOccurrenceDate() : undefined;
        const scheduleTimezone = scheduleData.Occurrence.getTZID();
        return {
          schedule: scheduleData.toPlain() as ScheduleDefinition,
          lastExecOccurrence: lastExecOccurrences[scheduleData.id],
          scheduleTimezone,
          campaignGroupId: campaignGroups.get(scheduleData.CampaignId),
          occurrenceListTimezone: outputTZ.name,
          occurrences: sched.times.map((scheduleTimeInfo) => {
            const toReturn: ScheduleOccurrenceInfo = {
              ...scheduleTimeInfo,
              start: '',
              end: '',
              status: 'NOT_STARTED',
            };
            const timeOccurrence = getISODateString(scheduleTimeInfo.start, scheduleTimezone);
            if (execution && execOccurrenceDate === timeOccurrence) {
              toReturn.status = execution.status;
            } else if (scheduleTimeInfo.end.getTime() < now.getTime()) {
              toReturn.status = 'FINISHED';
            } else if (timeOccurrence === lastExecOccurrences[scheduleData.id]) {
              toReturn.status = 'FINISHED';
            }
            const newStart = dateToZone(scheduleTimeInfo.start, outputTZ).toISO();
            const newEnd = dateToZone(scheduleTimeInfo.end, outputTZ).toISO();
            toReturn.start = newStart;
            toReturn.end = newEnd;
            return toReturn;
          }),
        };
      });
      const holidays = schedulesAndHolidays.holidays.map((holidayInfo) => {
        return {
          holiday: holidayInfo.holiday,
          times: holidayInfo.times.map((holidayTime) => {
            return {
              start: dateToZone(holidayTime.start, outputTZ).toISO(),
              end: dateToZone(holidayTime.end, outputTZ).toISO(),
            };
          }),
        };
      });
      const toReturn: ScheduleApiResponse = {
        schedules,
        holidays,
      };
      res.send(toReturn);
    }
  );

  async function setScheduleDisabled(scheduleId: string, disabled: boolean, occurrenceDateStr?: string) {
    if (occurrenceDateStr) {
      const parsedDate = DateTime.fromISO(occurrenceDateStr);
      if (!parsedDate.isValid) {
        throw `Supplied occurrence date is invalid: ${parsedDate.invalidExplanation}`;
      }
      occurrenceDateStr = parsedDate.toISODate();
    }
    const schedule = await scheduleManager.get(scheduleId);
    if (!schedule) {
      return null;
    }
    const disableResult = schedule.setDisabled(disabled, occurrenceDateStr);
    if (disableResult) {
      throw disableResult;
    }
    await scheduleManager.update(schedule);

    if (disabled) {
      const controlObj = new ScheduleControl();
      controlObj.action = ScheduleControlAction.STOP;
      controlObj.scheduleId = schedule.id;
      controlObj.occurrence = occurrenceDateStr;
      await scheduleControlStreamPublisher.scheduleControl([controlObj]);
    }

    return schedule;
  }

  router.post('/schedules/:id/enable/:occurrenceDate?', updateAuth, async (req: Request, res: Response) => {
    setScheduleDisabled(req.params.id, false, req.params.occurrenceDate)
      .then((schedule) => {
        if (schedule) {
          return res.send(schedule.toPlain());
        } else {
          return res.status(404).send();
        }
      })
      .catch((e) => {
        return sendErrorResponse(res, e, 400);
      });
  });

  router.post('/schedules/:id/disable/:occurrenceDate?', updateAuth, async (req: Request, res: Response) => {
    setScheduleDisabled(req.params.id, true, req.params.occurrenceDate)
      .then((schedule) => {
        if (schedule) {
          return res.send(schedule.toPlain());
        } else {
          return res.status(404).send(`Schedule with id ${req.params.id} not disabled`);
        }
      })
      .catch((e) => {
        return sendErrorResponse(res, e, 400);
      });
  });

  router.delete(
    '/schedules/:id/:occurrenceDate',
    makeAuth(CrudAction.DELETE, ...scheduleManager.validDeleteRoles),
    async (req: Request, res: Response) => {
      try {
        const schedule = await scheduleManager.get(req.params.id);
        if (!schedule) {
          return res.status(404).send();
        }
        const recurring = schedule.Occurrence.Recurring;
        if (!recurring) {
          return res.status(400).send('Cannot delete occurrence of non recurring schedule');
        }
        const occurrenceDate = stringToDate(req.params.occurrenceDate);
        if (!occurrenceDate) {
          return res.status(400).send('Invalid date specified');
        }
        recurring.Exclusions.push({
          Date: occurrenceDate.toISOString().substr(0, 10),
        });
        scheduleManager.update(schedule);
        res.status(200).send(schedule.toPlain());
      } catch (e) {
        logger.log('error', e);
        res.status(400).send(e);
      }
    }
  );

  router.post('/schedules/:id/:occurrenceDate', updateAuth, async (req: Request, res: Response) => {
    try {
      let occurrenceEntityDefinition;
      req.body.id = '';
      if (req.body.Occurrence) req.body.Occurrence.Recurring = undefined;
      try {
        occurrenceEntityDefinition = ScheduleDefinition.from(req.body);
      } catch (e) {
        const validationError = e as ValidationError;
        logger.log('info', validationError.toString());
        return res.status(400).send(formatError(e));
      }
      let occurrenceDateStr = req.params.occurrenceDate;
      const parsedDate = DateTime.fromISO(occurrenceDateStr);
      if (!parsedDate.isValid) {
        return res
          .status(400)
          .send(formatError(`Supplied occurrence date is invalid: ${parsedDate.invalidExplanation}`));
      }
      occurrenceDateStr = parsedDate.toISODate();
      const scheduleId = req.params.id;
      const schedule = await scheduleManager.get(scheduleId);
      if (!schedule) {
        return res.status(404).send(`Schedule with id ${scheduleId} not added`);
      }
      const updated = await scheduleManager.splitOccurrence(schedule, occurrenceDateStr, occurrenceEntityDefinition);
      if (!updated) {
        sendErrorResponse(res, 'Unknown error occurred', 500);
      }
      return res.send(updated.toPlain());
    } catch (e) {
      return sendErrorResponse(res, e, 500);
    }
  });

  router.post('/schedules/control', updateAuth, async (req: Request, res: Response) => {
    let scheduleExecControl;
    try {
      scheduleExecControl = ScheduleControl.from(req.body);
    } catch (e) {
      const validationError = e as ValidationError;
      logger.log('info', validationError.toString());
      return res.status(400).send(formatError(e));
    }
    const scheduleExecControlsArr = Array.isArray(scheduleExecControl) ? scheduleExecControl : [scheduleExecControl];
    try {
      await scheduleControlStreamPublisher.scheduleControl(scheduleExecControlsArr);
      return res.status(200).send(scheduleExecControl);
    } catch (e) {
      logger.log('info', e);
      res.status(500).send(formatError(e));
    }
  });

  return router;
}
