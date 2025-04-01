import { isNumber, isString } from 'lodash';
import { DateTime, IANAZone } from 'luxon';

export const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const localIANAZone = new IANAZone(localTimezone);
export const utcIANAZone = new IANAZone('UTC');

export function dateToZone(date: Date, timezone: string | IANAZone | undefined) {
  const zone = ensureIANAZone(timezone);
  return DateTime.fromJSDate(date).setZone(zone.name);
}

export function getISOTimeString(date: Date, timezone: string | IANAZone | undefined) {
  return dateToZone(date, timezone).toISOTime()!;
}

export function getHHMMTimeString(date: Date, timezone: string | IANAZone | undefined) {
  return getISOTimeString(date, timezone).substring(0, 5);
}

// Converts HH:MM string to JS date in the specified timezone
export function getDateFromHHMMString(hhmmString: string, timezone: string | IANAZone | undefined) {
  return DateTime.fromISO(`2022-03-21T${hhmmString}:00.000`, { zone: timezone }).toJSDate();
}

export function ensureIANAZone(zone?: string | IANAZone) {
  if (!zone) {
    return utcIANAZone;
  }
  return isString(zone) ? new IANAZone(zone) : zone;
}

export function getISODateString(date: Date, timezone: string | IANAZone | undefined) {
  return dateToZone(date, timezone).toISODate()!;
}

export function stringToDate(dateStr: string) {
  const dateNum = Date.parse(dateStr);
  if (isNaN(dateNum)) {
    return undefined;
  }
  return new Date(dateNum);
}

export function toDate(date: string | number | Date) {
  if (isNumber(date)) {
    return new Date(date);
  }
  if (isString(date)) {
    return new Date(Date.parse(date));
  }
  return date;
}

export function toDateTime(date: string | number | Date) {
  if (isNumber(date)) {
    return date;
  }
  if (isString(date)) {
    return Date.parse(date);
  }
  return date.getTime();
}
