import { IAccounts } from "@navient/common/dist/src/components/commons/types/commonTypes";
import {
  IHoliday,
  IHolidayID,
} from "@navient/common/dist/src/components/commons/types/holidayTypes";
import {
  ISchedule,
  ModType,
} from "@navient/common/dist/src/components/commons/types/schedulerTypes";
import { connect } from "react-redux";
import {
  getCampaignList,
  getContactListList,
  getGroupList,
  getContactFlowList,
} from "../../redux/actions/CampaignActions";
import { setProjectAccount } from "../../redux/actions/ConfigActions";
import { getDialerDefaults } from "../../redux/actions/GlobalActions";
import {
  addHoliday,
  addSchedule,
  deleteHoliday,
  deleteScheduleByID,
  enableScheduleDate,
  getACampaign,
  getContactFilters,
  getContactSorting,
  getHolidays,
  getPhoneFilters,
  getSchedule,
  getSchedulesBetweenTimesAction,
  resetCampaign,
  updateHoliday,
  updateOccurrenceID,
  updateScheduleByID,
} from "../../redux/actions/SchedulerActions";
import SchedulerView from "./SchedulerView";
import { RootState } from '../../redux/store';

const mapStateToProps = (state: RootState) => {
  return {
    schedules: state.schedule.schedules,
    holidays: state.schedule.holidays,
    campaigns: state.schedule.campaigns,
    contactFilters: state.schedule.contactFilters,
    phoneFilters: state.schedule.phoneFilters,
    contactSorting: state.schedule.contactSorting,
    contactLists: state.schedule.contactLists,
    campaign: state.schedule.campaign,
    contactFlows: state.schedule.contactFlows,
    dialerDefaults: state.global.dialerDefaultsConfig,
    accessLevel: state.rolesAccess.role,
    schedulesBetweenTimes: state.schedule.schedulesBetweenTimes,
    scheduleEvents: state.schedule.scheduleEvents,
    campaignGroups: state.campaign.groups,
    selectedAccount: state.config.selectedAccount,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  getSchedules: () => dispatch(getSchedule()),
  setAccount: (account_name: IAccounts | undefined | "All") =>
    dispatch(setProjectAccount(account_name)),
  getHolidays: () => dispatch(getHolidays()),
  getContactFilters: () => dispatch(getContactFilters()),
  getPhoneFilters: () => dispatch(getPhoneFilters()),
  getContactSorting: () => dispatch(getContactSorting()),
  getContactLists: () => dispatch(getContactListList()),
  getCampaigns: () => dispatch(getCampaignList()),
  getDialerDefaults: () => dispatch(getDialerDefaults()),
  getOneCampaign: (campaignID: string) => dispatch(getACampaign(campaignID)),
  getContactFlowList: () => dispatch(getContactFlowList()),
  resetCampaign: () => dispatch(resetCampaign()),
  deleteScheduleByID: (id: string, type: ModType, date: string) =>
    dispatch(deleteScheduleByID(id, type, date)),
  updateScheduleByID: (
    editedScheduleConfig: ISchedule,
    id: string,
    initialScheduleConfig: ISchedule
  ) =>
    dispatch(
      updateScheduleByID(editedScheduleConfig, id, initialScheduleConfig)
    ),
  updateOccurrenceID: (schedule: ISchedule, id: string, date: string) =>
    dispatch(updateOccurrenceID(schedule, id, date)),
  enableScheduleDate: (
    id: string,
    date: string,
    type: ModType,
    enable: boolean
  ) => dispatch(enableScheduleDate(id, date, type, enable)),
  addSchedule: (schedule: ISchedule) => dispatch(addSchedule(schedule)),
  getSchedulesBetweenTimes: (
    todayStart: Date,
    todayEnd: Date,
    events?: boolean
  ) => dispatch(getSchedulesBetweenTimesAction(todayStart, todayEnd, events)),
  addHoliday: (holiday: IHoliday) => dispatch(addHoliday(holiday)),
  updateHoliday: (holiday: IHoliday, initialHoliday: IHolidayID) =>
    dispatch(updateHoliday(holiday, initialHoliday)),
  deleteHoliday: (id: string) => dispatch(deleteHoliday(id)),
  getGroups: () => dispatch(getGroupList()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SchedulerView);
