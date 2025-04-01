import {
  GET_SCHEDULER_CONFIG,
  GET_ONE_CAMPAIGN,
  RESET_CAMPAIGN,
  ADD_SCHEDULER,
  DELETE_SCHEDULER,
  GET_PHONE_FILTERS,
  GET_CONTACT_FILTERS,
  GET_CONTACT_SORTING,
  UPDATE_SCHEDULER,
  UPDATE_OCCURRENCE,
  DISABLE_SCHEDULER,
  ENABLE_OCCURRENCE,
  ENABLE_SCHEDULER,
  DISABLE_OCCURRENCE,
  DELETE_OCCURRENCE,
  GET_SCHEDULES_BETWEEN_TIMES,
  GET_SCHEDULES_EVENTS_BETWEEN_TIMES,
  ADD_HOLIDAY,
  UPDATE_HOLIDAY,
  DELETE_HOLIDAY,
  GET_HOLIDAYS,
} from '../actions/SchedulerActions';
import {
  GET_CAMPAIGN_LIST,
  GET_CONTACT_FLOWS,
  GET_CONTACT_LISTS,
} from '../actions/CampaignActions';
import { IHoliday, IHolidayID } from '@navient/common/dist/src/components/commons/types/holidayTypes';
import { ContactFlowInfo } from '@navient/common/dist/src/types/connect-contact-flow';
import { ICampaign } from '@navient/common/dist/src/components/commons/types/campaignTypes';
import { ISchedule } from '@navient/common/dist/src/components/commons/types/schedulerTypes';
import { IContactList } from '@navient/common/dist/src/components/commons/types/contactListTypes';
import { ScheduleWithOcurrenceInfo } from 'navient-common/lib/types/schedules-api';

export interface CampaignState {
  schedules: ISchedule[];
  holidays: IHolidayID[];
  schedulesBetweenTimes: ScheduleWithOcurrenceInfo[];
  scheduleEvents: { schedules: ISchedule[]; holidays: IHoliday[] };
  campaigns: ICampaign[];
  campaign: ICampaign[];
  contactFilters: [];
  phoneFilters: any[];
  contactFlows: ContactFlowInfo[];
  contactSorting: any[];
  contactLists: IContactList[];
}

const initialState: CampaignState = {
  schedules: [],
  holidays: [],
  schedulesBetweenTimes: [],
  scheduleEvents: { schedules: [], holidays: [] },
  campaigns: [],
  campaign: [],
  contactFilters: [],
  phoneFilters: [],
  contactSorting: [],
  contactFlows: [],
  contactLists: [],
};

export default function reduce(state = initialState, action) {
 switch (action.type) {
    case `${GET_SCHEDULER_CONFIG}_FULFILLED`:
      state = {
        ...state,
        schedules: action.payload.data.schedules,
      };
      break;

    case `${GET_SCHEDULER_CONFIG}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${DELETE_SCHEDULER}_FULFILLED`:
      state = {
        ...state,
        schedules: state.schedules.filter((c) => c.id !== action.payload),
      };
      break;

    case `${DELETE_SCHEDULER}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${UPDATE_SCHEDULER}_FULFILLED`:
      const scheduleData = action.payload.data.schedule;
      const scheduleId = scheduleData.id;
      const scheduleCopy = state.schedules.find((c) => c.id === scheduleId);
      const scheduleIndex = scheduleCopy ? state.schedules.indexOf(scheduleCopy) : -1;
      const curSchedules = [...state.schedules];
      curSchedules.splice(scheduleIndex, 1, scheduleData);

      state = {
        ...state,
        schedules: curSchedules,
      };
      break;

    case `${DISABLE_SCHEDULER}_FULFILLED`:
    case `${ENABLE_SCHEDULER}_FULFILLED`:
      const data = action.payload.data;
      const id = data.id;
      const copy = state.schedules.find((c) => c.id === id);
      const index = copy ? state.schedules.indexOf(copy) : -1;
      const schedules = [...state.schedules];
      schedules.splice(index, 1, data);

      state = {
        ...state,
        schedules: schedules,
      };
      break;

    case `${DISABLE_OCCURRENCE}_FULFILLED`:
    case `${ENABLE_OCCURRENCE}_FULFILLED`:
    case `${DELETE_OCCURRENCE}_FULFILLED`:
      const occurrenceData = action.payload.data;
      const occurrenceId = occurrenceData.id;
      const occurrenceCopy = state.schedules.find((c) => c.id === occurrenceId);
      const occurrenceIndex = occurrenceCopy ? state.schedules.indexOf(occurrenceCopy) : -1;
      const occurrenceActionSchedules = [...state.schedules];
      occurrenceActionSchedules.splice(occurrenceIndex, 1, occurrenceData);

      state = {
        ...state,
        schedules: occurrenceActionSchedules,
      };
      break;

    case `${UPDATE_SCHEDULER}_REJECTED`:
    case `${UPDATE_OCCURRENCE}_REJECTED`:
    case `${DISABLE_SCHEDULER}_REJECTED`:
    case `${ENABLE_SCHEDULER}_REJECTED`:
    case `${DISABLE_OCCURRENCE}_REJECTED`:
    case `${ENABLE_OCCURRENCE}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${ADD_SCHEDULER}_FULFILLED`:
      const temp_schedules2 = [...state.schedules];
      temp_schedules2.push(action.payload.data.schedule);

      state = {
        ...state,
        schedules: temp_schedules2,
      };

      break;

    case `${UPDATE_OCCURRENCE}_FULFILLED`:
      const temp_schedules = [...state.schedules];
      temp_schedules.push(action.payload.data);

      state = {
        ...state,
        schedules: temp_schedules,
      };

      break;

    case `${ADD_SCHEDULER}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${GET_CONTACT_FILTERS}_FULFILLED`:
      state = {
        ...state,
        contactFilters: action.payload.data,
      };
      break;
    case `${GET_CONTACT_FILTERS}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${GET_PHONE_FILTERS}_FULFILLED`:
      state = {
        ...state,
        phoneFilters: action.payload.data,
      };
      break;
    case `${GET_PHONE_FILTERS}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${GET_CONTACT_SORTING}_FULFILLED`:
      state = {
        ...state,
        contactSorting: action.payload.data,
      };
      break;
    case `${GET_CONTACT_SORTING}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${GET_CAMPAIGN_LIST}_FULFILLED`:
      state = {
        ...state,
        campaigns: action.payload.data.campaigns,
      };
      break;
    case `${GET_CAMPAIGN_LIST}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${GET_ONE_CAMPAIGN}_FULFILLED`:
      state = {
        ...state,
        campaign: action.payload.data.campaign,
      };
      break;
    case `${GET_ONE_CAMPAIGN}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${GET_CONTACT_FLOWS}_FULFILLED`:
      state = {
        ...state,
        contactFlows: action.payload.data,
      };
      break;
    case `${GET_CONTACT_FLOWS}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case RESET_CAMPAIGN:
      state = {
        ...state,
        campaign: [],
      };
      break;

    case `${GET_CONTACT_LISTS}_FULFILLED`:
      state = {
        ...state,
        contactLists: action.payload.data.contactlists,
      };
      break;

    case `${GET_CONTACT_LISTS}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${GET_SCHEDULES_BETWEEN_TIMES}_FULFILLED`:
      state = {
        ...state,
        schedulesBetweenTimes: action.payload.data.schedules,
      };
      break;

    case `${GET_SCHEDULES_BETWEEN_TIMES}_PENDING`:
      state = {
        ...state,
      };
      break;

    case `${GET_SCHEDULES_BETWEEN_TIMES}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${GET_SCHEDULES_EVENTS_BETWEEN_TIMES}_FULFILLED`:
      state = {
        ...state,
        scheduleEvents: action.payload.data,
      };
      break;

    case `${GET_SCHEDULES_EVENTS_BETWEEN_TIMES}_PENDING`:
      state = {
        ...state,
      };
      break;

    case `${GET_SCHEDULES_EVENTS_BETWEEN_TIMES}_REJECTED`:
      state = {
        ...state,
      };
      break;
    case `${ADD_HOLIDAY}_FULFILLED`:
      state = {
        ...state,
      };
      break;
    case `${UPDATE_HOLIDAY}_FULFILLED`:
      state = {
        ...state,
      };
      break;
    case `${DELETE_HOLIDAY}_FULFILLED`:
      state = {
        ...state,
      };
      break;
    case `${GET_HOLIDAYS}_FULFILLED`:
      state = {
        ...state,
        holidays: action.payload.data.holidays,
      };
      break;

    default:
      break;
  }

  return state;
}
