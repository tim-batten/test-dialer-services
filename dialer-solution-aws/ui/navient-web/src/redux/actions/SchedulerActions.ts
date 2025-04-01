import {
  getSchedulerList,
  deleteSchedule,
  updateSchedule,
  updateOccurrence,
  enableSchedule,
  addSchedule as _addSchedule,
  getContactFilterList,
  getPhoneFilterList,
  getContactSortingList,
  getOneCampaign,
  getSchedulesBetweenTimes,
  addHoliday as _addHoliday,
  updateHoliday as _updateHoliday,
  deleteHoliday as _deleteHoliday,
  getAllHolidays,
} from "@navient/common";
import {
  IHoliday,
  IHolidayID,
} from "@navient/common/dist/src/components/commons/types/holidayTypes";
import {
  ISchedule,
  ModType,
} from "@navient/common/dist/src/components/commons/types/schedulerTypes";

export const GET_SCHEDULER_CONFIG = "GET_SCHEDULER_CONFIG";
export const DELETE_SCHEDULER = "DELETE_SCHEDULER";
export const DELETE_OCCURRENCE = "DELETE_OCCURRENCE";
export const UPDATE_SCHEDULER = "UPDATE_SCHEDULER";
export const UPDATE_OCCURRENCE = "UPDATE_OCCURRENCE";
export const ENABLE_SCHEDULER = "ENABLE_SCHEDULER";
export const ENABLE_OCCURRENCE = "ENABLE_OCCURRENCE";
export const DISABLE_SCHEDULER = "DISABLE_SCHEDULER";
export const DISABLE_OCCURRENCE = "DISABLE_OCCURRENCE";
export const ADD_SCHEDULER = "ADD_SCHEDULER";
export const GET_CONTACT_FILTERS = "GET_CONTACT_FILTERS";
export const GET_PHONE_FILTERS = "GET_PHONE_FILTERS";
export const GET_CONTACT_SORTING = "GET_CONTACT_SORTING";
export const GET_ONE_CAMPAIGN = "GET_ONE_CAMPAIGN";
export const RESET_CAMPAIGN = "RESET_CAMPAIGN";
export const GET_SCHEDULES_BETWEEN_TIMES = "GET_SCHEDULES_BETWEEN_TIMES";
export const GET_SCHEDULES_EVENTS_BETWEEN_TIMES =
  "GET_SCHEDULES_EVENTS_BETWEEN_TIMES";
export const GET_HOLIDAYS = "GET_HOLIDAYS";
export const ADD_HOLIDAY = "ADD_HOLIDAY";
export const UPDATE_HOLIDAY = "UPDATE_HOLIDAY";
export const DELETE_HOLIDAY = "DELETE_HOLIDAY";

export function getSchedule() {
  return {
    type: GET_SCHEDULER_CONFIG,
    /** you can call api here */
    payload: getSchedulerList(),
  };
}

export function deleteScheduleByID(id: string, type: ModType, date: string) {
  return {
    type: type === "series" ? DELETE_SCHEDULER : DELETE_OCCURRENCE,
    /** you can call api here */
    payload: deleteSchedule(id, type, date),
  };
}

export function updateScheduleByID(
  editedScheduleConfig: ISchedule,
  id: string,
  initialScheduleConfig: ISchedule
) {
  return {
    type: UPDATE_SCHEDULER,
    /** you can call api here */
    payload: updateSchedule(editedScheduleConfig, id, initialScheduleConfig),
  };
}

export function enableScheduleDate(
  id: string,
  date: string,
  type: ModType,
  enable: boolean
) {
  return {
    type: enable ? ENABLE_SCHEDULER : DISABLE_SCHEDULER,
    /** you can call api here */
    payload: enableSchedule(id, date, type, enable),
  };
}

export function updateOccurrenceID(
  schedule: ISchedule,
  id: string,
  date: string
) {
  return {
    type: UPDATE_OCCURRENCE,
    /** you can call api here */
    payload: updateOccurrence(schedule, id, date),
  };
}

export function addSchedule(schedule: ISchedule) {
  return {
    type: ADD_SCHEDULER,
    /** you can call api here */
    payload: _addSchedule(schedule),
  };
}

export function getContactFilters() {
  return {
    type: GET_CONTACT_FILTERS,
    /** you can call api here */
    payload: getContactFilterList(),
  };
}

export function getPhoneFilters() {
  return {
    type: GET_PHONE_FILTERS,
    /** you can call api here */
    payload: getPhoneFilterList(),
  };
}

export function getContactSorting() {
  return {
    type: GET_CONTACT_SORTING,
    /** you can call api here */
    payload: getContactSortingList(),
  };
}

// export function getCampaignList() {
//   return {
//     type: GET_CAMPAIGNS,
//     /** you can call api here */
//     payload: getCampaign(),
//   };
// }

export function getACampaign(campaignID: string) {
  return {
    type: GET_ONE_CAMPAIGN,
    payload: getOneCampaign(campaignID),
  };
}

export function resetCampaign() {
  return {
    type: RESET_CAMPAIGN,
  };
}

export function getSchedulesBetweenTimesAction(
  todayStart: Date,
  todayEnd: Date,
  events?: boolean
) {
  return {
    type: events
      ? GET_SCHEDULES_EVENTS_BETWEEN_TIMES
      : GET_SCHEDULES_BETWEEN_TIMES,
    payload: getSchedulesBetweenTimes(
      todayStart.toISOString(),
      todayEnd.toISOString()
    ),
  };
}

export function getHolidays() {
  return {
    type: GET_HOLIDAYS,
    /** you can call api here */
    payload: getAllHolidays(),
  };
}

export function addHoliday(holiday: IHoliday) {
  return {
    type: ADD_HOLIDAY,
    payload: _addHoliday(holiday),
  };
}

export function updateHoliday(holiday: IHoliday, initialHoliday: IHolidayID) {
  return {
    type: UPDATE_HOLIDAY,
    payload: _updateHoliday(holiday, initialHoliday),
  };
}

export function deleteHoliday(id: string) {
  return {
    type: DELETE_HOLIDAY,
    payload: _deleteHoliday(id),
  };
}
