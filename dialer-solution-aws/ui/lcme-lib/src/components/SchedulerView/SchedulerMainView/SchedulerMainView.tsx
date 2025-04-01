/* eslint-disable no-empty-pattern */
import { Button } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import moment from 'moment-timezone';
import React, { useEffect, useState } from 'react';
import { SnackbarComponent } from '../..';
import {
  allDataFilter,
  config_baseURL,
  isBaseURLAll,
  set_account_override
} from '../../../api/utils';
import { AccessRoles } from '../../../constants/AccessLevel';
import useNoInitialEffect from '../../../hooks/react-mod-hooks';
import { AccountSelector } from '../../commons/AccountSelector';
import { SideBarComponent } from '../../commons/SideBarComponent';
import {
  IAccounts,
  IDateRange
} from '../../commons/types/commonTypes';
import { IHoliday, IHolidayID } from '../../commons/types/holidayTypes';
import {
  IEnableReason,
  ISchedule,
  IScheduleEvents,
  ModType,
} from '../../commons/types/schedulerTypes';
import { getRemovedTimeZoneBuff } from '../../commons/utils/DateFormatter';
import {
  changeDTSTART,
  removeUntil
} from '../../commons/utils/RRulesUtils';
import { SchedulerConfigurator } from '../SchedulerConfigurator';
import { Calendar } from './Calendar';
import { HolidayConfigurator } from './Calendar/HolidayConfigurator';
import {
  ButtonWrapper,
  Content,
  Title,
  TitleWrapper,
  Wrapper,
} from './SchedulerMainView.Styles';
import { ICallBackMessage } from '../../commons/types/commonTypes';
import { Viewer } from '../SchedulerConfigurator/Viewer';
import { FormSchedule } from '../../commons/types/schedulerFormTypes';
import { FloatingPaper } from '../../commons/FloatingPaper';
import { ContactFlowInfo } from '../../../types/connect-contact-flow';
import { ICampaign } from '../../commons/types/campaignTypes';
import { IDialerDefaults } from '../../commons/types/globalTypes';
import { ScheduleWithOcurrenceInfo } from 'lcme-common/lib/types/schedules-api';

interface ISchedulerMainView {
  schedules: ISchedule[];
  holidays: IHolidayID[];
  selectedAccount: IAccounts | undefined | 'All';
  schedulesBetweenTimes: ScheduleWithOcurrenceInfo[];
  scheduleEvents: any;
  campaigns: ICampaign[];
  campaign: any;
  campaignGroups: any;
  contactFilters: any;
  phoneFilters: any;
  contactSorting: any;
  contactLists: any;
  contactFlows: ContactFlowInfo[];
  accessLevel: any;
  setAccount: (account: IAccounts | undefined | 'All') => void;
  getSchedules: () => void;
  getHolidays: () => void;
  getContactFilters: () => void;
  getPhoneFilters: () => void;
  getContactSorting: () => void;
  getContactLists: () => void;
  getCampaigns: () => void;
  getOneCampaign: (campaignID: string) => any;
  getContactFlowList: () => void;
  getGroups: () => void;
  resetCampaign: () => void;
  deleteScheduleByID: (
    id: string,
    type: ModType,
    date: string,
    callback: (info: any) => void,
  ) => void;
  updateScheduleByID: (
    editedScheduleConfig: ISchedule,
    id: string,
    callback: (info: any) => void,
    initialScheduleConfig: ISchedule,
  ) => void;
  updateOccurrenceID: (
    schedule: ISchedule,
    id: string,
    date: string,
    callback: (info: any) => void,
  ) => void;

  enableScheduleDate: (
    id: string,
    date: string,
    type: ModType,
    enable: boolean,
    callback: (info: any) => void,
  ) => void;
  addSchedule: (schedule: ISchedule, callback: (info: any) => void) => void;
  dialerDefaults: IDialerDefaults;
  getDialerDefaults: () => void;
  getSchedulesBetweenTimes: (
    todayStart: Date,
    todayEnd: Date,
    events?: boolean,
  ) => void;
  addHoliday: (holiday: IHoliday, callback: (info: any) => void) => void;
  updateHoliday: (
    holiday: IHoliday,
    initialHoliday: IHolidayID,
    callback: (info: any) => void,
  ) => void;
  deleteHoliday: (id: string, callback: (info: any) => void) => void;
}

export const SchedulerMainView: React.FunctionComponent<ISchedulerMainView> = ({
  schedules,
  holidays,
  schedulesBetweenTimes,
  scheduleEvents,
  campaigns,
  campaignGroups,
  contactFilters,
  phoneFilters,
  contactSorting,
  contactLists,
  campaign,
  contactFlows: contactFlows,
  accessLevel,
  selectedAccount,
  setAccount,
  getOneCampaign,
  getSchedules,
  getHolidays,
  getCampaigns,
  getContactFlowList,
  getContactFilters,
  getPhoneFilters,
  getContactSorting,
  getContactLists,
  resetCampaign,
  deleteScheduleByID,
  updateScheduleByID,
  updateOccurrenceID,
  enableScheduleDate,
  addSchedule,
  dialerDefaults:tempDialerDefaults,
  getDialerDefaults,
  getSchedulesBetweenTimes,
  addHoliday,
  updateHoliday,
  deleteHoliday,
  getGroups,
}) => {
  const dateNow = new Date(),
    y = dateNow.getFullYear(),
    m = dateNow.getMonth();
  const [readOnly, setReadOnly] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [holidaySideBar, setHolidaySideBar] = useState(false);
  // const [scheduleEvents, setScheduleEvents] = useState([]);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [severity, setSeverity] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('success');
  const [alertTitle, setAlertTitle] = useState('');
  const [dataId, setDataId] = useState('');
  const [dataDates, setDataDates] = useState<{ start: Date; end: Date }>();
  const [creating, setCreating] = useState(false);
  const [selectedSched, setSelectedSched] = useState<any>();
  const [selectedHoliday, setSelectedHoliday] = useState<any>();
  const [modType, setModType] = useState<ModType>('series');
  const [occurrenceDate, setOccurrenceDate] = useState('');
  const [calendarTimeZone, setCalendarTimeZone] = useState(moment.tz.guess());
  const [calendarDateRange, setCalendarDateRange] = useState<IDateRange>({
    start: new Date(y, m, 1),
    end: new Date(y, m + 1, 6),
  });
  const [dialerDefaults, setGlobalDefaults] = useState<any>(tempDialerDefaults);
  const [accountURL, setAccountURL] = useState<any>(config_baseURL());
  const [enableSchedule, setEnableSchedule] = useState<any>();
  const [skipModal, setSkipModal] = useState(true);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [selectedExportSchedule, setSelectedExportSchedule] = useState<any>();

  const handleSideBar = () => {
    setHolidaySideBar(true);
    setCreating(true);
    handleOpenSideBar();
  };

  const handleOpenSideBar = (readOnly?: boolean) => {
    setOpenSidebar(true);
    setSkipModal(true);
    if (!readOnly && accessLevel !== AccessRoles.READ_ONLY)
      localStorage.setItem('onEditMode', '1');
  };

  useEffect(() => {
    getSchedules();
    getHolidays();
    getCampaigns();
    getContactFilters();
    getPhoneFilters();
    getContactSorting();
    resetCampaign();
    getContactFlowList();
    getDialerDefaults();
    getContactLists();
    getGroups();
  }, [selectedAccount]);

  useEffect(() => {
    if (Array.isArray(tempDialerDefaults)) {
      const temp = tempDialerDefaults.find(
        (tg) => tg.prjacc.url === config_baseURL(),
      );
      setGlobalDefaults(temp);
    } else {
      setGlobalDefaults(tempDialerDefaults);
    }
  }, [accountURL, tempDialerDefaults]);

  useNoInitialEffect(() => {
    set_account_override('1');
    if (!isBaseURLAll()) {
      getCampaigns();
      getContactFilters();
      getPhoneFilters();
      getContactSorting();
      getContactFlowList();
      getDialerDefaults();
      getContactLists();
      getGroups();
    }
    return () => set_account_override('0');
  }, [accountURL]);

  useEffect(() => {
    if (severity === 'success' && openSnack) {
      getSchedulesBetweenTimes(
        calendarDateRange?.start,
        calendarDateRange?.end,
        true,
      );
    }
  }, [openSnack]);

  const pollSchedulesBetweenTimes = async () => {
    const timezoneOffsetHours = new Date().getTimezoneOffset() / 60;
    const todayStart = new Date(
      new Date().setHours(0 + timezoneOffsetHours, 0, 0),
    );
    const todayEnd = new Date(
      new Date().setHours(23 + timezoneOffsetHours, 59, 59),
    );
    await getSchedulesBetweenTimes(
      todayStart,
      todayEnd,
    );
  }
  
  useEffect(() => {
    const pollTimer = setInterval(pollSchedulesBetweenTimes, 60 * 1000 );
    return () => clearInterval(pollTimer);
  }, [selectedAccount]);

  const handleAlertClose = () => {
    setOpenAlert(false);
  };
  const onDeleteSeries = () => {
    if (modType === 'series') {
      deleteScheduleByID(dataId, modType, '', (data) => {
        handleDeleteCallback(data);
      });
    } else {
      deleteScheduleByID(dataId, modType, occurrenceDate, (data) => {
        handleDeleteCallback(data);
      });
    }
    setOpenAlert(false);
  };

  const onEdit = (
    data_id,
    data: { start: Date; end: Date },
    type: ModType,
    readOnly?: boolean,
  ) => {
    const selectedSchdlEvent: IScheduleEvents = scheduleEvents.schedules.find(
      (sched) => sched.schedule.id === data_id,
    );
    const selectedSchdl: ISchedule = {
      ...selectedSchdlEvent.schedule,
      ScheduleTimeZone: selectedSchdlEvent.scheduleTimezone,
    };

    if (isBaseURLAll()) {
      selectedSchdl['prjacc'] = selectedSchdlEvent?.['prjacc'];
    }
    setDataId(data_id);
    handleOpenSideBar(readOnly);
    setCreating(false);
    setModType(type);
    setDataDates(data);
    if (type === 'occurrence') {
      let rrule = changeDTSTART(
        selectedSchdl.Occurrence.Recurring?.RRule || '',
        selectedSchdlEvent.scheduleTimezone
          ? new Date(
            getRemovedTimeZoneBuff(
              new Date(data.start),
              selectedSchdlEvent.scheduleTimezone,
            ),
          )
          : data.start,
      );

      rrule = removeUntil(rrule);
      setSelectedSched({
        ...selectedSchdl,
        Occurrence: {
          ...selectedSchdl.Occurrence,
          Recurring: { ...selectedSchdl.Occurrence.Recurring, RRule: rrule },
        },
      });

      // TODO: Detect is the occurrence has already running
      // if(selectedSchdlEvent.occurrences.find(
      //   (oc) => oc.start === data.start.toISOString(),
      // )?.status==='FINISHED'){

      // }
    } else {
      setSelectedSched(selectedSchdl);
    }
  };

  const onCopy = (data_id, data: { start: Date; end: Date }, type: ModType) => {
    const selectedSchdlEvent: IScheduleEvents = scheduleEvents.schedules.find(
      (sched) => sched.schedule.id === data_id,
    );
    const selectedSchdl: ISchedule = {
      ...selectedSchdlEvent.schedule,
      ScheduleTimeZone: selectedSchdlEvent.scheduleTimezone,
    };

    if (isBaseURLAll()) {
      selectedSchdl['prjacc'] = selectedSchdlEvent?.['prjacc'];
    }

    setDataId(data_id);
    handleOpenSideBar();
    setCreating(true);
    setModType(type);
    setDataDates(data);

    if (type === 'occurrence') {
      let rrule = changeDTSTART(
        selectedSchdl.Occurrence.Recurring?.RRule || '',
        selectedSchdlEvent.scheduleTimezone
          ? new Date(
            getRemovedTimeZoneBuff(
              new Date(data.start),
              selectedSchdlEvent.scheduleTimezone,
            ),
          )
          : data.start,
      );
      rrule = removeUntil(rrule);

      setSelectedSched({
        ...selectedSchdl,
        Occurrence: {
          ...selectedSchdl.Occurrence,
          Recurring: { ...selectedSchdl.Occurrence.Recurring, RRule: rrule },
        },
      });
    } else {
      setSelectedSched(selectedSchdl);
    }
  };

  const onExport = (data_id) => {
    const selectedSchdlEvent: IScheduleEvents = scheduleEvents.schedules.find(
      (sched) => sched.schedule.id === data_id,
    );

    const selectedSchdl: ISchedule = {
      ...selectedSchdlEvent.schedule,
      ScheduleTimeZone: selectedSchdlEvent.scheduleTimezone,
    };

    setSelectedExportSchedule(selectedSchdl);
    setOpenExportDialog(true);
  }
  const onDelete = (data_id, date: string, discard: () => void) => {
    setDataId(data_id);
    setOpenAlert(true);
    setOccurrenceDate(date);
    setAlertTitle('Delete Schedule Series');
    setAlertMessage(
      'Are you sure you want to delete this series? All events will be deleted.',
    );
    discard();
  };

  const onEnable = (data) => {
    const status = data.action.type;
    const conflict = data.error?.status;

    if (conflict === 409 || data.error?.conflictingOccurrence) {
      setSnackMessage(
        `Schedule Overlap Conflict appears on ${data.error.conflictingOccurrence}`,
      );

      setSeverity('warning');
    } else {
      switch (status) {
        case `UPDATE_SCHEDULER_FULFILLED`:
        case `UPDATE_OCCURRENCE_FULFILLED`:
        case `DISABLE_SCHEDULER_FULFILLED`:
        case `ENABLE_SCHEDULER_FULFILLED`:
        case `DISABLE_OCCURRENCE_FULFILLED`:
        case `ENABLE_OCCURRENCE_FULFILLED`:
          setSnackMessage('Success!');
          setSeverity('success');
          break;
        default:
          setSnackMessage('Failed!');
          setSeverity('error');
          break;
      }
    }
    setOpenSnack(true);
  };

  const handleUpdateCallback = (data, discard: () => void) => {
    const status = data.action.type;
    const conflict = data.error?.status;
    if (status === 'UPDATE_SCHEDULER_FULFILLED') {
      setSnackMessage('Schedule Updated!');
      setSeverity('success');
      discard();
    } else if (status === 'UPDATE_OCCURRENCE_FULFILLED') {
      setSnackMessage('Schedule Occurrence Updated!');
      setSeverity('success');
      discard();
    } else if (conflict === 409 || data.error?.conflictingOccurrence) {
      setSnackMessage(
        `Schedule Overlap Conflict appears on ${data.error.conflictingOccurrence}`,
      );
      setSeverity('warning');
    } else if (data.errorMessage && data.errorMessage.includes('409')) {
      setSnackMessage('Data state is stale; refresh & retry!');
      setSeverity('error');
    } else {
      if (data?.action?.message === 'Not Found') {
        setSnackMessage('Schedule Update Failed, Schedule Not Found!');
      } else {
        setSnackMessage('Schedule Update Failed!');
      }
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  const handleAddCallback = (data, discard: () => void) => {
    const status = data.action.type;
    const conflict = data.error?.status;

    if (status === 'ADD_SCHEDULER_FULFILLED') {
      setSnackMessage('Schedule Created!');
      setSeverity('success');
      discard();
    } else if (conflict === 409 || data.error?.conflictingOccurrence) {
      setSnackMessage(
        `Schedule Overlap Conflict appears on ${data.error.conflictingOccurrence}`,
      );
      setSeverity('warning');
    } else {
      setSnackMessage('Schedule Creation Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  const handleDeleteCallback = (data) => {
    const status = data.action.type;
    if (status === 'DELETE_SCHEDULER_FULFILLED') {
      setSnackMessage('Schedule Series Deleted!');
      setSeverity('success');
    } else if (status === 'DELETE_OCCURRENCE_FULFILLED') {
      setSnackMessage('Schedule Occurrence Deleted!');
      setSeverity('success');
    } else {
      setSnackMessage('Schedule Series Deletion Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  const handleAddHolidayCallback = (data, discard: () => void) => {
    const status = data.action.type;
    if (status === 'ADD_HOLIDAY_FULFILLED') {
      setSnackMessage('Holiday Created!');
      setSeverity('success');
      discard();
    } else {
      setSnackMessage('Holiday Creation Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  const handleUpdateHolidayCallback = (data, discard: () => void) => {
    const status = data.action.type;
    if (status === 'UPDATE_HOLIDAY_FULFILLED') {
      setSnackMessage('Holiday Updated!');
      setSeverity('success');
      discard();
    } else {
      setSnackMessage('Holiday Updated Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  const handleDeleteHolidayCallback = (data, discard: () => void) => {
    const status = data.action.type;
    if (status === 'DELETE_HOLIDAY_FULFILLED') {
      setSnackMessage('Holiday Deleted!');
      setSeverity('success');
      discard();
    } else {
      setSnackMessage('Holiday Deletion Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  const alertReadOnly = () => {
    setSnackMessage('Access Denied');
    setSeverity('info');
    setOpenSnack(true);
  };

  const onHolidayEdit = (holiday: IHolidayID) => {
    setSelectedHoliday(holiday);
    setCreating(false);
    setHolidaySideBar(true);
    handleOpenSideBar();
  };

  const handleEnableHolidayOverRide = (
    data_id: string,
    reason: IEnableReason,
  ) => {
    const schedule: Omit<ISchedule, 'ScheduleTimeZone'> =
      scheduleEvents.schedules.find(
        (sched) => sched.schedule.id === data_id,
      )?.schedule;

    if (schedule) {
      const template = {
        ...schedule,
        Occurrence: {
          Single: {
            Date: reason.date,
            Parent: data_id,
          },
          Duration: schedule.Occurrence.Duration,
        },
      };
      updateOccurrenceID(template, data_id, reason.date, (data) => {
        const status = data.action.type;
        if (status === 'UPDATE_OCCURRENCE_FULFILLED') {
          setSnackMessage('Schedule Occurrence Transformed and Enabled!');
          setSeverity('success');
          setOpenSnack(true);
        }
      });
    }
  };

  return (
    <Wrapper>
      <TitleWrapper>
        <Title variant='h6'>Scheduler</Title>
        <ButtonWrapper>
          <AccountSelector
            initialValue={selectedAccount}
            onValueChange={(data) => setAccount(data)}
            disabled={openSidebar}
          />
          <Button
            disabled={openSidebar}
            variant='contained'
            color='primary'
            size='small'
            onClick={() => {
              handleOpenSideBar();
              setSelectedSched({});
              setCreating(true);
            }}
          >
            {accessLevel === AccessRoles.READ_ONLY
              ? 'See Form'
              : 'New Schedule'}
          </Button>
        </ButtonWrapper>
      </TitleWrapper>
      <SideBarComponent
        topOffSet={47}
        open={openSidebar}
        readonly={readOnly || accessLevel === AccessRoles.READ_ONLY}
        onClose={() => {
          setSkipModal(true);
          resetCampaign();
        }}
        component={
          holidaySideBar ? (
            <HolidayConfigurator
              holidays={holidays}
              onAlert={(message, severity) => {
                setSnackMessage(message);
                setSeverity(severity);
                setOpenSnack(true);
              }}
              onDiscardClick={() => {
                setOpenSidebar(false);
                setHolidaySideBar(false);
                setReadOnly(false);
                setSelectedHoliday({});
                localStorage.setItem('onEditMode', '0');
              }}
              creating={creating}
              onSubmit={(form) => form}
              addHoliday={(holiday, discard) => {
                addHoliday(holiday, (data) => {
                  handleAddHolidayCallback(data, discard);
                });
              }}
              updateHoliday={(
                holiday: IHoliday,
                initialHoliday: IHolidayID,
                discard: () => void,
              ) => {
                updateHoliday(holiday, initialHoliday, (data) => {
                  handleUpdateHolidayCallback(data, discard);
                });
              }}
              deleteHoliday={(id: string, discard: () => void) => {
                deleteHoliday(id, (data) => {
                  handleDeleteHolidayCallback(data, discard);
                });
              }}
              holiday={selectedHoliday}
              setSelectedHD={(data) => setSelectedHoliday(data)}
              onAccountChange={(url) => setAccountURL(url)}
            />
          ) : (
            <SchedulerConfigurator
              readOnly={readOnly || accessLevel === AccessRoles.READ_ONLY}
              onDiscardClick={() => {
                setOpenSidebar(false);
                setReadOnly(false);
                localStorage.setItem('onEditMode', '0');
              }}
              setSelectedSched={(data) => setSelectedSched(data)}
              scheduleEvents={allDataFilter(scheduleEvents, 'no-array')}
              schedules={allDataFilter(schedules)}
              campaigns={allDataFilter(campaigns)}
              contactFlows={allDataFilter(contactFlows)}
              contactFilters={allDataFilter(contactFilters)}
              phoneFilters={allDataFilter(phoneFilters)}
              onCampaignChange={() => setSkipModal(false)}
              contactSorting={allDataFilter(contactSorting)}
              contactLists={allDataFilter(contactLists)}
              skipModal={skipModal}
              campaign={campaign}
              getOneCampaign={getOneCampaign}
              dialerDefaults={dialerDefaults}
              creating={creating}
              selectedSched={selectedSched}
              updateSchedule={(
                editedScheduleConfig: ISchedule,
                id: string,
                date: string,
                discard,
                initialScheduleConfig: ISchedule,
              ) => {
                if (modType === 'series') {
                  updateScheduleByID(
                    editedScheduleConfig,
                    id,
                    (data) => {
                      handleUpdateCallback(data, discard);
                    },
                    initialScheduleConfig,
                  );
                } else if (modType === 'occurrence') {
                  updateOccurrenceID(
                    editedScheduleConfig,
                    id,
                    dataDates ? new Date(dataDates.start).toISOString() : date,
                    (data) => {
                      handleUpdateCallback(data, discard);
                    },
                  );
                }
              }}
              addSchedule={(schedule: ISchedule, discard) => {
                addSchedule(schedule, (data) => {
                  handleAddCallback(data, discard);
                });
              }}
              onDelete={(data_id, date: string, discard) => {
                if (accessLevel === AccessRoles.READ_ONLY) {
                  alertReadOnly();
                } else {
                  onDelete(data_id, date, discard);
                }
              }}
              onAlert={(data, severity) => {
                setSnackMessage(data);
                setSeverity(severity);
                setOpenSnack(true);
              }}
              modType={modType}
              calendarTimeZone={calendarTimeZone}
              schedulesBetweenTimes={allDataFilter(schedulesBetweenTimes)}
              onAccountChange={(url) => setAccountURL(url)}
              getSchedulesBetweenTimes={getSchedulesBetweenTimes}
            />
          )
        }
      >
        <Content>
          <Calendar
            selectedAccount={selectedAccount}
            scheduleEvents={scheduleEvents}
            schedulesBetweenTimes={schedulesBetweenTimes}
            campaignGroups={campaignGroups}
            dialerDefaults={dialerDefaults}
            handleSideBar={handleSideBar}
            openSidebar={openSidebar}
            onEdit={(
              data_id,
              data: any | { start: Date; end: Date },
              type: ModType,
            ) => {
              if (accessLevel === AccessRoles.READ_ONLY) {
                alertReadOnly();
              } else {
                onEdit(data_id, data, type);
                if (type === 'series') {
                  setSnackMessage(
                    'This will only affect current and future schedules.',
                  );
                  setSeverity('info');
                  setOpenSnack(true);
                }
              }
            }}
            onCopy={(
              data_id,
              data: any | { start: Date; end: Date },
              type: ModType,
            ) => {
              if (accessLevel === AccessRoles.READ_ONLY) {
                alertReadOnly();
              } else {
                onCopy(data_id, data, type);
              }
            }}
            onEnable={(
              data_id: string,
              date: string,
              type: ModType,
              enable: boolean,
              reason: IEnableReason | undefined,
            ) => {
              if (accessLevel === AccessRoles.READ_ONLY) {
                alertReadOnly();
              } else if (reason && reason.disabledReason === 'holiday') {
                handleEnableHolidayOverRide(data_id, reason);
              } else {
                enableScheduleDate(data_id, date, type, enable, (data) => {
                  onEnable(data);
                });
              }
            }}
            onView={(
              data_id,
              data: any | { start: Date; end: Date },
              type: ModType,
            ) => {
              setReadOnly(true);
              onEdit(data_id, data, type, true);
            }}
            onExport={(data_id) => onExport(data_id)}
            onTimeZoneChange={(timezone) => setCalendarTimeZone(timezone)}
            campaigns={campaigns}
            getSchedulesBetweenTimes={(todayStart: Date, todayEnd: Date) =>
              getSchedulesBetweenTimes(todayStart, todayEnd, true)
            }
            onHolidayEdit={(holiday) => {
              if (accessLevel === AccessRoles.READ_ONLY) {
                alertReadOnly();
              } else {
                onHolidayEdit(holiday);
              }
            }}
            onRangeChange={(dateRage) => setCalendarDateRange(dateRage)}
          />
        </Content>
      </SideBarComponent>

      <Dialog
        open={openAlert}
        onClose={() => handleAlertClose()}
        aria-labelledby='alert-delete'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-delete'>{alertTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            {alertMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleAlertClose()} color='primary'>
            Disagree
          </Button>
          <Button
            onClick={() => {
              onDeleteSeries();
            }}
            color='primary'
            autoFocus
          >
            Agree
          </Button>
        </DialogActions>
      </Dialog>
      <SnackbarComponent
        open={openSnack}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onAlertClose={() => setOpenSnack(false)}
        autoHideDuration={5000}
        alertMessage={snackMessage}
        severity={severity}
      />

      <Viewer
        formData={{} as FormSchedule}
        open={openExportDialog}
        onClose={open => setOpenExportDialog(open)}
        scheduleData={selectedExportSchedule}
        calendarTimeZone={calendarTimeZone}
        modType={modType}
        contactFilters={allDataFilter(contactFilters)}
        contactSorting={allDataFilter(contactSorting)}
        phoneFilters={allDataFilter(phoneFilters)}
      />
    </Wrapper>
  );
};

SchedulerMainView.defaultProps = {
  // bla: 'test',
};
