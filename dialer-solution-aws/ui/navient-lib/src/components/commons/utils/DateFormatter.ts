import moment from 'moment-timezone';

/**
 *
 * @param {Date} date - A JavaScript Date Object
 * @returns {string} Time string in military format hh:mm
 */
export const toTime = (date: Date): string => {
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

/**
 *
 * @param {Date} date - A JavaScript Date Object
 * @returns {string} Time string in military format hh:mm ampm
 */
export const toSTime = (date: Date): string => {
  const time = toTime(date);
  const hour = parseInt(time.split(':')[0]);
  const minutes = time.split(':')[1];
  return hour > 12
    ? `${hour - 12}:${minutes}pm`
    : `${hour == 0 ? 12 : hour}:${minutes}${hour === 12 ? 'pm' : 'am'}`;
};

/**
 * Return an event start from an specific date
 * @param {Date} _date - A JavaScript Date Object
 * @returns {string} Time string in military format hh:mm
 */
export const toTimeStart = (_date: Date): string => {
  var date = _date;
  if (date.getMinutes() < 30) {
    date.setMinutes(30);
  } else {
    date.setMinutes(0);
    date.setHours(date.getHours() + 1);
  }
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

/**
 * Return an event end from an specific date
 * @param {Date} _date - A JavaScript Date Object
 * @returns {string} Time string in military format hh:mm
 */
export const toTimeEnd = (_date: Date): string => {
  var date = _date;
  if (date.getMinutes() < 30) {
    date.setMinutes(0);
    date.setHours(date.getHours() + 1);
  } else {
    date.setMinutes(30);
    date.setHours(date.getHours() + 1);
  }
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

/**
 *
 * @param {Date} date - A JavaScript Date Object
 * @returns {string} Date string format yyyy-mm-dd
 */
export const toDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
};
/**
 *
 * @param dateString Date string format yyyy-mm-dd
 * @returns {Date}
 */
export const toStringDate = (dateString: string): Date => {
  const splitDate = dateString.split('-');
  const year = parseInt(splitDate[0]);
  const month = parseInt(splitDate[1]);
  const day = parseInt(splitDate[2]);

  return new Date(year, month - 1, day);
};
/**
 * Get Duration in millisecond
 * @param start
 * @param end
 * @returns millisecond
 */
export const getTimeDuration = (start: Date, end: Date) => {
  const _start = new Date();
  const _end = new Date();
  _start.setHours(start.getHours());
  _start.setMinutes(start.getMinutes());

  _end.setHours(end.getHours());
  _end.setMinutes(end.getMinutes());
  if (
    end > start &&
    timeToMins(start.getHours(), start.getMinutes()) >
    timeToMins(end.getHours(), end.getMinutes())
  ) {
    _end.setDate(_end.getDate() + 1);
  }
  return _end.getTime() - _start.getTime();
};

const timeToMins = (hour: number, minute: number) => {
  return hour * 60 + minute;
};
/**
 *  Get Date from a date and time string
 * @param date
 * @param time
 * @returns Date
 */
export const getDateFromString = (date: Date, time: string) => {
  const hour = parseInt(time.split(':')[0]);
  const minute = parseInt(time.split(':')[1]);
  date.setHours(hour);
  date.setMinutes(minute);

  return date;
};

/**
 *  Convert the local date to a specific time zone without changing the time, returns UTC string format
 * @param date
 * @param timeZone
 * @returns sting
 */
export const getConvertedTimeZoneInUTC = (date: Date, timeZoneS: string) => {
  const timezone = moment.tz(date.toISOString(), moment.tz.guess());
  const convertedTZ = timezone.clone().tz(timeZoneS, true);
  return convertedTZ.clone().tz('UTC').format();
};

/**
 *  Convert the local date to a specific time zone without changing the time, returns UTC string format
 * @param date
 * @param timeZone
 * @returns sting
 */
export const getRetainTimeZoneInUTC = (
  date: Date,
  timeZoneS: string,
  retainTz?: string,
) => {
  const timezone = moment.tz(date.toISOString(), moment.tz.guess());
  let convertedTZ = timezone.clone().tz(timeZoneS, true);
  if (retainTz) {
    convertedTZ = convertedTZ.clone().tz(retainTz);
  }
  const utc = convertedTZ.clone().tz('UTC', true).format();

  return utc;
};
/**
 * Convert timeZone from tz to another tz
 * @param date
 * @param fromTZ
 * @param toTZ
 * @returns
 */
export const convertTimeZone = (date: Date, fromTZ: string, toTZ: string) => {
  const from = moment.tz(date, fromTZ);
  const to = from.clone().tz(toTZ);
  const final = to.clone().tz(fromTZ, true);

  return final.clone().tz('UTC').format();
};

/**
 * Return date with 00:00:00:00 time
 * @param date
 * @returns
 */
export const toBareDate = (date: Date) => {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
};

export const getRemovedTimeZoneBuff = (date: Date, timeZoneS: string) => {
  const timezone = moment.tz(date.toISOString(), timeZoneS);
  return timezone.clone().tz('UTC', true).format();
};

/**
 * Return date with 00:00:00 am/pm time
 * @param time string
 * @returns string
 */
export const convertFromMTime = (input) => {
  return moment(input, 'HH:mm:ss').format('h:mm:ss A');
}



/**
 * 
 * @param timeString 
 * @returns 
 */
export const convertToHourMin = (timeString) => {
  const hour = timeString.split(':')[0]
  const min = timeString.split(':')[1]
  return `${hour}:${min}`
}