import { AccessRoles, SchedulerMainView } from "@navient/common";
import { IAccounts } from "@navient/common/dist/src/components/commons/types/commonTypes";
import {
  IHoliday,
  IHolidayID,
} from "@navient/common/dist/src/components/commons/types/holidayTypes";
import {
  ISchedule,
  ModType,
} from "@navient/common/dist/src/components/commons/types/schedulerTypes";
import { Component } from "react";
import { ContactFlowInfo } from '@navient/common/dist/src/types/connect-contact-flow';
import { ICampaign } from '@navient/common/dist/src/components/commons/types/campaignTypes';
import { IDialerDefaults } from '@navient/common/dist/src/components/commons/types/globalTypes';
import { ScheduleWithOcurrenceInfo } from 'navient-common/lib/types/schedules-api';

interface Props {
  schedules: ISchedule[];
  selectedAccount: IAccounts | undefined | 'All';
  holidays: IHolidayID[];
  schedulesBetweenTimes: ScheduleWithOcurrenceInfo[];
  scheduleEvents: any;
  campaigns: ICampaign[];
  dialerDefaults: IDialerDefaults;
  campaign: any;
  contactFilters: any;
  phoneFilters: any;
  contactSorting: any;
  contactLists: any;
  contactFlows: ContactFlowInfo[];
  accessLevel: AccessRoles;
  campaignGroups: any;
  setAccount: (account_name: IAccounts | undefined | 'All') => void;
  getCampaigns: () => void;
  getGroups: () => void;
  getContactFilters: () => void;
  getPhoneFilters: () => void;
  getContactLists: () => void;
  getContactSorting: () => void;
  getSchedules: () => void;
  getHolidays: () => void;
  getOneCampaign: (campaignID: string) => void;
  getContactFlowList: () => void;
  resetCampaign: () => void;
  deleteScheduleByID: (id: string, type: ModType, date: string) => Promise<any>;
  updateScheduleByID: (editedScheduleConfig: ISchedule, id: string, initialScheduleConfig: ISchedule) => Promise<any>;
  updateOccurrenceID: (schedule: ISchedule, id: string, date: string) => Promise<any>;
  enableScheduleDate: (id: string, date: string, type: ModType, enable: boolean) => Promise<any>;
  addSchedule: (schedule: ISchedule) => Promise<any>;
  getDialerDefaults: () => void;
  getSchedulesBetweenTimes: (todayStart: Date, todayEnd: Date, events?: boolean) => void;
  addHoliday: (holiday: IHoliday) => Promise<any>;
  updateHoliday: (holiday: IHoliday, initialHoliday: IHolidayID) => Promise<any>;
  deleteHoliday: (id: string) => Promise<any>;
}
interface State {}

export class SchedulerView extends Component<Props, State> {
  state = {};

  handleScheduleUpdate = (
    editedScheduleConfig: ISchedule,
    id: string,
    callback: (info: any) => void,
    initialScheduleConfig: ISchedule
  ) => {
    this.props
      .updateScheduleByID(editedScheduleConfig, id, initialScheduleConfig)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({
          action: { type: "error", message: error?.response?.statusText },
          errorMessage: error.message,
          error: error?.response?.data,
        });
      });
  };

  handleOccurrenceUpdate = (
    schedule: ISchedule,
    id: string,
    date: string,
    callback: (info: any) => void
  ) => {
    this.props
      .updateOccurrenceID(schedule, id, date)
      .then((data) => {
        callback(data);
        this.props.getSchedules();
      })
      .catch((error) => {
        callback({ action: { type: "error" }, error: error?.response?.data });
      });
  };

  handleScheduleDateEnabling = (
    id: string,
    date: string,
    type: ModType,
    enable: boolean,
    callback: (info: any) => void
  ) => {
    this.props
      .enableScheduleDate(id, date, type, enable)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" }, error: error?.response?.data });
      });
  };

  handleScheduleAdd = (schedule: ISchedule, callback: (info: any) => void) => {
    this.props
      .addSchedule(schedule)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" }, error: error?.response?.data });
      });
  };

  handleScheduleDelete = (
    id,
    type: ModType,
    date: string,
    callback: (info: any) => void
  ) => {
    this.props
      .deleteScheduleByID(id, type, date)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" } });
      });
  };

  handleHolidayAdd = (holiday: IHoliday, callback: (info: any) => void) => {
    this.props
      .addHoliday(holiday)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" } });
      });
  };

  handleHolidayUpdate = (
    holiday: IHoliday,
    initialHoliday: IHolidayID,
    callback: (info: any) => void
  ) => {
    this.props
      .updateHoliday(holiday, initialHoliday)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" } });
      });
  };

  handleHolidayDelete = (id: string, callback: (info: any) => void) => {
    this.props
      .deleteHoliday(id)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" } });
      });
  };
  render() {
    return (
      <SchedulerMainView
        schedules={this.props.schedules}
        holidays={this.props.holidays}
        schedulesBetweenTimes={this.props.schedulesBetweenTimes}
        scheduleEvents={this.props.scheduleEvents}
        campaigns={this.props.campaigns}
        campaign={this.props.campaign}
        campaignGroups={this.props.campaignGroups}
        contactFlows={this.props.contactFlows}
        contactFilters={this.props.contactFilters}
        phoneFilters={this.props.phoneFilters}
        contactSorting={this.props.contactSorting}
        contactLists={this.props.contactLists}
        accessLevel={this.props.accessLevel}
        getSchedules={() => this.props.getSchedules()}
        getHolidays={() => this.props.getHolidays()}
        getCampaigns={() => this.props.getCampaigns()}
        getContactFilters={() => this.props.getContactFilters()}
        getPhoneFilters={() => this.props.getPhoneFilters()}
        getContactSorting={() => this.props.getContactSorting()}
        getContactLists={() => this.props.getContactLists()}
        getOneCampaign={(campaignID: string) =>
          this.props.getOneCampaign(campaignID)
        }
        getContactFlowList={() => this.props.getContactFlowList()}
        resetCampaign={() => this.props.resetCampaign()}
        deleteScheduleByID={(
          id,
          type: ModType,
          date: string,
          callback: (info: any) => void
        ) => this.handleScheduleDelete(id, type, date, callback)}
        updateScheduleByID={(
          editedScheduleConfig: ISchedule,
          id: string,
          callback: (info: any) => void,
          initialScheduleConfig: ISchedule
        ) =>
          this.handleScheduleUpdate(
            editedScheduleConfig,
            id,
            callback,
            initialScheduleConfig
          )
        }
        updateOccurrenceID={(
          schedule: ISchedule,
          id: string,
          date: string,
          callback: (info: any) => void
        ) => this.handleOccurrenceUpdate(schedule, id, date, callback)}
        enableScheduleDate={(
          id: string,
          date: string,
          type: ModType,
          enable: boolean,
          callback: (info: any) => void
        ) => this.handleScheduleDateEnabling(id, date, type, enable, callback)}
        addSchedule={(schedule: ISchedule, callback: (info: any) => void) =>
          this.handleScheduleAdd(schedule, callback)
        }
        dialerDefaults={this.props.dialerDefaults}
        getDialerDefaults={() => this.props.getDialerDefaults()}
        getGroups={() => this.props.getGroups()}
        getSchedulesBetweenTimes={(
          todayStart: Date,
          todayEnd: Date,
          events?: boolean
        ) => this.props.getSchedulesBetweenTimes(todayStart, todayEnd, events)}
        addHoliday={(holiday: IHoliday, callback: (info: any) => void) =>
          this.handleHolidayAdd(holiday, callback)
        }
        updateHoliday={(
          holiday: IHoliday,
          initialHoliday: IHolidayID,
          callback: (info: any) => void
        ) => this.handleHolidayUpdate(holiday, initialHoliday, callback)}
        deleteHoliday={(id: string, callback: (info: any) => void) =>
          this.handleHolidayDelete(id, callback)
        }
        selectedAccount={this.props.selectedAccount}
        setAccount={(account: IAccounts | undefined | "All") =>
          this.props.setAccount(account)
        }
      />
    );
  }
}

export default SchedulerView;
