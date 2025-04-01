/* eslint-disable no-unused-vars */
import moment from 'moment-timezone';
import { RRule, RRuleSet, Weekday, WeekdayStr } from 'rrule';
import { QueryMethods } from 'rrule/dist/esm/types';
import { ISched } from '../types/schedulerTypes';
import {
  convertTimeZone,
  getConvertedTimeZoneInUTC,
  getDateFromString,
  getRetainTimeZoneInUTC,
  getTimeDuration,
  toDateString,
  toStringDate,
  toTime,
  toTimeEnd,
  toTimeStart,
} from './DateFormatter';

interface IRecurrence {
  type: 'doesNotRepeat' | 'daily' | 'weekly' | 'monthly';
  value: number;
  misc: any;
}
export interface IScheduleEvent {
  eventName: string;
  eventID: string;
  timeZone: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  recurrence: IRecurrence;
  isEnabled: boolean;
  hasOccurrences?: boolean;
  doesEnd: boolean;
  isHoliday?: boolean;
  campaignId: any;
}

export const getRRuleWeekFormString = (week: string) => {
  const _week = week.toLocaleLowerCase();
  if (_week === 'sunday') {
    return RRule.SU;
  } else if (_week === 'monday') {
    return RRule.MO;
  } else if (_week === 'tuesday') {
    return RRule.TU;
  } else if (_week === 'wednesday') {
    return RRule.WE;
  } else if (_week === 'thursday') {
    return RRule.TH;
  } else if (_week === 'friday') {
    return RRule.FR;
  } else if (_week === 'saturday') {
    return RRule.SA;
  } else {
    return RRule.SA;
  }
};

export const getRRuleStringValue = (rruleString: string, attribute: string) => {
  const dtStart = getDtStart(rruleString);
  const arryString: string[] = rruleString.replace('RRULE:', '').split(/\n|#/);
  const pair: string =
    arryString?.[1].split(';').find((a) => a.includes(attribute)) || '';
  return attribute === 'TZID'
    ? dtStart.timeZone
    : attribute === 'DTSTART'
    ? dtStart.time
    : pair?.split(/=/)[1];
};

export const getDtStart = (rrule_string: string) => {
  const rule: string[] = rrule_string?.replace('RRULE:', '').split(/\n|#/);

  const dtstart = rule?.find((r) => r.includes('DTSTART'))?.split(/;|:/);
  const timeZone = dtstart?.find((r) => r.includes('TZID'))?.split('=')[1];
  const time = dtstart?.[dtstart?.length - 1];

  return { timeZone, time };
};

export const rRuleDateConvert = (
  dtdate: string,
  duration?: number,
  timeZone?: { fromTZ: string; toTZ: string },
  bufferTZ?: string,
): string => {
  const string_date = dtdate.split('T')[0];
  const string_time = dtdate.split('T')[1];
  const now = new Date();
  const year = string_date.slice(0, 4);
  const month = string_date.slice(4, 6);
  const day = string_date.slice(6, string_date.length);
  const hour = string_time.slice(0, 2);
  const minutes = string_time.slice(2, 4);
  const seconds = string_time.slice(4, 6);
  const tz = 'Z';
  let date = new Date(
    `${year}-${month}-${day}T${hour}:${minutes}:${seconds}.0${tz}`,
  );
  if (duration) {
    date = new Date(date.getTime() + duration * 60000);
  }

  if (timeZone) {
    date = new Date(convertTimeZone(date, timeZone.fromTZ, timeZone.toTZ));
  }

  if (bufferTZ) {
    date.setHours(date.getHours() - moment.tz(date, bufferTZ).utcOffset() / 60);
  }
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}|${date
    .getHours()
    .toString()
    .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date
    .getSeconds()
    .toString()
    .padStart(2, '0')}|${date.toISOString()}`;
};

export const changeDTSTART = (rrule_string: string, date: Date): string => {
  const dtstart = getRRuleStringValue(rrule_string, 'DTSTART') || '';
  const temp_date = new Date(date).toISOString().replaceAll(/-|:|/g, '');
  const date_string = temp_date.replace(temp_date.slice(-5, -1), '');

  return rrule_string.replace(dtstart, date_string);
};

export const removeUntil = (rrule_string: string): string => {
  const until = getRRuleStringValue(rrule_string, 'UNTIL') || '';
  const temp_rule = rrule_string.replace(until, '');
  return temp_rule.replace(';UNTIL=', '');
};

export const dtStartToISO = (rrule_string: string): string => {
  const dtstart = getRRuleStringValue(rrule_string, 'DTSTART') || '';

  return rRuleDateConvert(dtstart).split('|')[2];
};

export const endDateToISO = (
  rrule_string: string,
  duration: number,
): string => {
  const dtstart = getRRuleStringValue(rrule_string, 'DTSTART') || '';
  const until = getRRuleStringValue(rrule_string, 'UNTIL') || '';
  if (until) {
    return rRuleDateConvert(until).split('|')[2];
  }
  return rRuleDateConvert(dtstart, duration).split('|')[2];
};

const convertRRuleDay = (rrule_day): string => {
  let day = '';
  if (rrule_day === 'SU') {
    day = 'sunday';
  } else if (rrule_day === 'MO') {
    day = 'monday';
  } else if (rrule_day === 'TU') {
    day = 'tuesday';
  } else if (rrule_day === 'WE') {
    day = 'wednesday';
  } else if (rrule_day === 'TH') {
    day = 'thursday';
  } else if (rrule_day === 'FR') {
    day = 'friday';
  } else if (rrule_day === 'SA') {
    day = 'saturday';
  }
  return day;
};

export const singleOccurrenceDecode = (
  start: string,
  duration: number,
  fromTZ: string,
  toTZ: string,
) => {
  //TODO: Change 'EST' to timeZone
  const startDate = new Date(
    convertTimeZone(new Date(start), fromTZ, toTZ === 'Eastern' ? 'EST' : toTZ),
  );

  const endDate = new Date(startDate.getTime() + duration * 60000);
  const schedule: ISched = {
    timeZone: toTZ === 'Eastern' ? 'EST' : toTZ,
    doesEnd: true,
    startDate: toDateString(startDate),
    startTime: toTime(startDate),
    endTime: toTime(endDate),
    endDate: toDateString(endDate),
    recurrence: { type: 'doesNotRepeat', value: 1, misc: '' },
  };

  return schedule;
};

export const rRuleDecode = (
  rrule_string: string,
  duration: number,
  fromTZ: string,
  toTZ: string,
  scheduleTimeZone: string,
): ISched => {
  const schedule: ISched = {
    timeZone: toTZ === 'Eastern' ? 'EST' : toTZ,
    doesEnd: true,
    startDate: toDateString(new Date()),
    startTime: toTimeStart(new Date()),
    endTime: toTimeEnd(new Date()),
    endDate: toDateString(new Date()),
    recurrence: { type: 'doesNotRepeat', value: 1, misc: '' },
  };

  const timeZone = { fromTZ, toTZ: schedule.timeZone };

  const dtstart = getRRuleStringValue(rrule_string, 'DTSTART') || '';
  const until = getRRuleStringValue(rrule_string, 'UNTIL') || '';
  const freq = getRRuleStringValue(rrule_string, 'FREQ') || '';
  const count = getRRuleStringValue(rrule_string, 'COUNT') || '';
  const interval = getRRuleStringValue(rrule_string, 'INTERVAL') || '';
  const byweekday =
    getRRuleStringValue(rrule_string, 'BYDAY')?.split(',') || '';
  const bymonthday =
    getRRuleStringValue(rrule_string, 'BYMONTHDAY')?.split(',') || '';

  if (dtstart) {
    schedule.startDate = rRuleDateConvert(
      dtstart,
      undefined,
      timeZone,
      scheduleTimeZone,
    ).split('|')[0];
    schedule.startTime = rRuleDateConvert(
      dtstart,
      undefined,
      timeZone,
      scheduleTimeZone,
    ).split('|')[1];
  }
  if (until) {
    schedule.endDate = rRuleDateConvert(
      until,
      undefined,
      timeZone,
      scheduleTimeZone,
    ).split('|')[0];
    schedule.endTime = rRuleDateConvert(
      dtstart,
      duration,
      timeZone,
      scheduleTimeZone,
    ).split('|')[1];
  } else if (dtstart) {
    schedule.doesEnd = false;
    schedule.endTime = rRuleDateConvert(
      dtstart,
      duration,
      timeZone,
      scheduleTimeZone,
    ).split('|')[1];
  }
  if (freq) {
    schedule.recurrence.type =
      count && parseInt(count) === 1 ? 'doesNotRepeat' : freq.toLowerCase();
  }

  if (interval) {
    schedule.recurrence.value = parseInt(interval);
  }

  if (bymonthday) {
    if (parseInt(bymonthday[0])) {
      schedule.recurrence.misc = {
        day: bymonthday.map((day) => parseInt(day)),
      };
    } else {
      schedule.recurrence.misc = {
        dow: bymonthday.map((day) => parseInt(day)),
      };
    }
  }

  if (byweekday) {
    if (freq === 'MONTHLY') {
      const bday = byweekday[0]?.replaceAll('+', '');
      schedule.recurrence.misc = {
        day: parseInt(bday?.slice(0, 1)),
        dow: bday?.slice(-2),
      };
    } else {
      schedule.recurrence.misc = byweekday.map((day) => convertRRuleDay(day));
    }
  }
  return schedule;
};

const getNthWeekDay = (week: WeekdayStr, day: number): Weekday => {
  let rule: Weekday = RRule.MO.nth(day);

  if (week === 'MO') {
    rule = RRule.MO.nth(day);
  } else if (week === 'TU') {
    rule = RRule.TU.nth(day);
  } else if (week === 'WE') {
    rule = RRule.WE.nth(day);
  } else if (week === 'TH') {
    rule = RRule.TH.nth(day);
  } else if (week === 'FR') {
    rule = RRule.FR.nth(day);
  } else if (week === 'SA') {
    rule = RRule.SA.nth(day);
  } else if (week === 'SU') {
    rule = RRule.SU.nth(day);
  }
  return rule;
};

export class ScheduleEvents {
  rRule: QueryMethods | undefined;
  config: IScheduleEvent;
  duration: number | undefined;
  startDate: Date;
  endDate: Date;

  constructor() {
    this.config = {} as IScheduleEvent;
    this.startDate = new Date();
    this.endDate = new Date();
  }

  public conf(config: IScheduleEvent, tzid) {
    this.config = config;
    this.startDate = new Date(
      getRetainTimeZoneInUTC(
        getDateFromString(toStringDate(config.startDate), config.startTime),
        config.timeZone,
        tzid,
      ),
    );
    this.endDate = new Date(
      getRetainTimeZoneInUTC(
        getDateFromString(toStringDate(config.endDate), config.endTime),
        config.timeZone,
        tzid,
      ),
    );

    const durationStart = getDateFromString(
      toStringDate(config.startDate),
      config.startTime,
    );
    const durationEnd = getDateFromString(
      toStringDate(config.endDate),
      config.endTime,
    );
    this.duration = getTimeDuration(durationStart, durationEnd);

    if (config.recurrence.type === 'doesNotRepeat') {
      this.rRule = new RRule({
        freq: RRule.DAILY,
        count: 1,
        dtstart: this.startDate,
        until: this.endDate,
        tzid,
      });
    } else if (config.recurrence.type === 'daily') {
      if (config.doesEnd) {
        this.rRule = new RRule({
          freq: RRule.DAILY,
          interval: config.recurrence.value,
          dtstart: this.startDate,
          until: this.endDate,
          tzid,
        });
      } else {
        this.rRule = new RRule({
          freq: RRule.DAILY,
          interval: config.recurrence.value,
          dtstart: this.startDate,
          tzid,
        });
      }
    } else if (config.recurrence.type === 'weekly') {
      if (config.doesEnd) {
        this.rRule = new RRule({
          freq: RRule.WEEKLY,
          interval: config.recurrence.value,
          dtstart: this.startDate,
          until: this.endDate,
          byweekday: config.recurrence.misc.map((m: string) =>
            getRRuleWeekFormString(m),
          ),
          tzid,
        });
      } else {
        this.rRule = new RRule({
          freq: RRule.WEEKLY,
          interval: config.recurrence.value,
          dtstart: this.startDate,
          byweekday: config.recurrence.misc.map((m: string) =>
            getRRuleWeekFormString(m),
          ),
          tzid,
        });
      }
    } else if (config.recurrence.type === 'monthly') {
      const day = config.recurrence.misc.day;
      const dow = config.recurrence.misc.dow;
      let mothRule: any = {
        freq: RRule.MONTHLY,
        interval: config.recurrence.value,
        dtstart: this.startDate,
        until: this.endDate,
        bymonthday: day,
        tzid,
      };
      if (dow && dow !== null) {
        mothRule = {
          freq: RRule.MONTHLY,
          interval: config.recurrence.value,
          dtstart: this.startDate,
          until: this.endDate,
          byweekday: [getNthWeekDay(dow, day)],
          tzid,
        };
      }

      !config.doesEnd && delete mothRule.until;
      this.rRule = new RRule(mothRule);
    }

    return this;
  }

  public fromString(config: IScheduleEvent, duration: number, rRuleString) {
    this.config = config;
    this.rRule = RRule.fromString(rRuleString);
    this.duration = duration * 60000;

    return this;
  }

  public getTimesBetween(
    start: Date,
    end: Date,
    occurrenceType: string,
    rruleSet?: RRuleSet,
  ): any[] {
    // const dtstart = new Date(Date.UTC(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate(), this.startDate.getHours(), this.startDate.getMinutes(), 0))
    // const until = new Date(Date.UTC(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate(), this.endDate.getHours(), this.endDate.getMinutes(), 0))
    const events = rruleSet
      ? rruleSet.between(start, end, true)
      : this.rRule
      ? this.rRule.between(start, end, true)
      : [];

    return events.map((date: { getTime: () => any }) => {
      return {
        id: date.getTime() + Math.random(),
        data_id: this.config.eventID,
        title: this.config.eventName,
        isHoliday: this.config.isHoliday,
        isEnabled: this.config.isEnabled,
        campaignId: this.config.campaignId,
        allDay: false,
        start: date,
        end: new Date(date.getTime() + this.duration),
        occurrenceType,
      };
    });
  }
}
