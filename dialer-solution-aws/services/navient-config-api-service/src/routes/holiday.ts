import { Router, Request, Response } from "express";
import { CrudAction, makeConfigRouter } from "./config-entity-route-builder";
import { HolidayDefinition } from "navient-common/lib/models/holiday";
import { holidayManager } from "../globals";
import { makeAuth } from "../auth/auth";
import { IANAZone } from "luxon";
import { formatError } from "navient-services-common/lib/utils/error-helper";
import { dateToZone, ensureIANAZone } from "navient-common/lib/utils/date-helper";

export function makeHolidayRouter(): Router {
    const router = makeConfigRouter(holidayManager, HolidayDefinition.from, 'holiday', 'holidays')

    router.get('/holidays', makeAuth(CrudAction.READ, ...holidayManager.validReadRoles), async (req: any, res: Response) => {
        const { startTime, endTime, status, inputTimezone, outputTimezone } = req.query
        if (!startTime && !endTime) {
            return res.status(400).send('Must specify a start and end time')
        }
        const inputTZ = inputTimezone ? new IANAZone(inputTimezone) : undefined
        if (inputTZ && !inputTZ.isValid) {
            return res.status(400).send(formatError(`Supplied input timezone '${inputTimezone}' is not a valid IANA timezone`))
        }
        const outputTZ = ensureIANAZone(outputTimezone)
        if (outputTZ && !outputTZ.isValid) {
            return res.status(400).send(formatError(`Supplied output timezone '${outputTimezone}' is not a valid IANA timezone`))
        }
        const startTimeParsed = Date.parse(startTime)
        const endTimeParsed = Date.parse(endTime)
        if (isNaN(startTimeParsed)) {
            return res.status(400).send('Start time is invalid')
        }
        if (isNaN(endTimeParsed)) {
            return res.status(400).send('End time is invalid')
        }
        const holidaysBetween = await holidayManager.getAllTimesBetween(new Date(startTimeParsed), new Date(endTimeParsed), inputTZ)
        const toReturn = holidaysBetween.map((holidayInfo) => {
            return {
                holiday: holidayInfo.holiday,
                times: holidayInfo.times.map((holidayTime) => {
                    return {
                        start: dateToZone(holidayTime.start, outputTZ).toISO(),
                        end: dateToZone(holidayTime.end, outputTZ).toISO()
                    }
                })
            }
        })
        res.send(toReturn)
    })
    
    return router
    
}