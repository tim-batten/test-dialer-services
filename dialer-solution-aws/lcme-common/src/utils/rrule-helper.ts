import { isString, times } from "lodash";
import { DateTime, IANAZone } from "luxon";
import { RRuleSet, RRule } from "rrule";
import { ensureIANAZone, localIANAZone, toDate, toDateTime } from './date-helper';

export function utcToTimezoneMillis(utcDateNum: number, outputZone: IANAZone) {
    return utcDateNum + outputZone.offset(utcDateNum) * 60000
}

export function timezoneToUtcMillis(utcDateNum: number, inputZone: IANAZone) {
    return utcDateNum - inputZone.offset(utcDateNum) * 60000
}

export function getTZID(rrule: RRule | RRuleSet) {
    if (rrule instanceof RRuleSet) {
        return rrule.tzid()
    } else {
        return rrule.options.tzid
    }
}

function getRRuleInputDate(rrule: RRule | RRuleSet, dateTime: string | number | Date, inputTimezone?: IANAZone) {
    const dateTimeMillis = toDateTime(dateTime)
    const utcDateMillis = inputTimezone ? timezoneToUtcMillis(dateTimeMillis, inputTimezone) : dateTimeMillis
    if (getTZID(rrule)) {
        const systemDateMillis = utcToTimezoneMillis(utcDateMillis, localIANAZone)
        //console.log(new Date(dateTimeMillis), 'in', inputTimezone ? inputTimezone : 'UTC', 'is', new Date(utcDateMillis), 'utc and', new Date(systemDateMillis), 'in system timezone', localIANAZone)
        return new Date(systemDateMillis)
    }
    return toDate(utcDateMillis)
}

export function rruleResultToUTC(rrule: RRule | RRuleSet, date: Date) {
    const utcMillis = getTZID(rrule) ? DateTime.fromJSDate(date)
        .toUTC()
        .setZone('local', { keepLocalTime: true })
        .toMillis() : date.getTime()
    return new Date(utcMillis)
}

export function rruleResultsToUTC(rrule: RRule | RRuleSet, dates: Date[]) {
    return dates.map((date) => rruleResultToUTC(rrule, date))
}

export function getRRuleUTCStartDate(rrule: RRule) {
    return rruleResultToUTC(rrule, rrule.options.dtstart)
}

export type RRuleHelperOptions = {
    inputTimezone: string | IANAZone
}

export class RRuleHelper {
    static betweenTZ(rrule: RRule | RRuleSet, startDate: string | number | Date, endDate: string | number | Date, options: Partial<RRuleHelperOptions> = {}) {
        const rruleStartDate = getRRuleInputDate(rrule, startDate, ensureIANAZone(options.inputTimezone))
        const rruleEndDate = getRRuleInputDate(rrule, endDate, ensureIANAZone(options.inputTimezone))
        const betweens = rrule.between(rruleStartDate, rruleEndDate, true)
        return rruleResultsToUTC(rrule, betweens)
    }

    static beforeTZ(rrule: RRule | RRuleSet, endDate: string | number | Date, options: Partial<RRuleHelperOptions> = {}) {
        const rruleEndDate = getRRuleInputDate(rrule, endDate, ensureIANAZone(options.inputTimezone))
        const before = rrule.before(rruleEndDate)
        return before ? rruleResultToUTC(rrule, before) : undefined
    }

    static afterTZ(rrule: RRule | RRuleSet, startDate: string | number | Date, options: Partial<RRuleHelperOptions> = {}) {
        const rruleStartDate = getRRuleInputDate(rrule, startDate, ensureIANAZone(options.inputTimezone))
        const after = rrule.after(rruleStartDate)
        return after ? rruleResultToUTC(rrule, after) : undefined
    }
}

export function makeRuleSet(tzid: string | undefined | null, timeReference: Date | string, dates: string[]) {
    const toReturn = new RRuleSet()
    toReturn.tzid(tzid)
    dates.forEach((date) => {
        toReturn.rdate(makeRDate(date, timeReference))
    })
    return toReturn
}

export function makeRDate(isoDateStr: string, timeReference: Date | string) {
    return new Date(isoDateStr + (isString(timeReference) ? `T${timeReference}.000Z` : timeReference.toISOString().substr(10)))
}

export type RecurrenceDateExclusion = {
    id?: string
    name?: string
    reason?: string
    tzid?: string
    data?: any
    isoDate: string
}