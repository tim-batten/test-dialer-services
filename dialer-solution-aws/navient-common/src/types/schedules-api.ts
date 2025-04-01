import { HolidayDefinition } from '../models/holiday';
import { ScheduleDefinition, TimesBetweenReturn } from '../models/schedule';
import { ScheduleExecutionStatus } from '../models/schedule-execution';

export type ScheduleOccurrenceInfo = {
  start: string;
  end: string;
  status: ScheduleExecutionStatus | 'FINISHED' | 'NOT_STARTED';
  disabled?: boolean;
  disablingEntityId?: string;
  disablingEntityName?: string;
  disabledReason?: string;
};

export type ScheduleWithOcurrenceInfo = {
  schedule: ScheduleDefinition;
  lastExecOccurrence: string;
  scheduleTimezone?: string;
  campaignGroupId?: string;
  occurrenceListTimezone: string;
  occurrences: ScheduleOccurrenceInfo[];
};

export type HolidayTime = {
  start: string;
  end: string;
};

export type HolidayResponse = {
    holiday: HolidayDefinition;
    times: HolidayTime[];
};

export type ScheduleApiResponse = {
    schedules: ScheduleWithOcurrenceInfo[],
    holidays: HolidayResponse[],
}