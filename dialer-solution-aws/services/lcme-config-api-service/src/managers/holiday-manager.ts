import { IANAZone } from "luxon";
import { HolidayDefinition } from "lcme-common/lib/models/holiday";
import { holidayDb } from "../globals";
import { GenericEntityManager } from "./generic-entity-manager";

export class HolidayConfigManager extends GenericEntityManager<HolidayDefinition> {
    constructor() {
        super(holidayDb)
    }

    getAllTimesBetween(start: Date, end: Date, inputTZ?: IANAZone) {
        return holidayDb.getAllTimesBetween(start, end, { inputTimezone: inputTZ })
    }
}