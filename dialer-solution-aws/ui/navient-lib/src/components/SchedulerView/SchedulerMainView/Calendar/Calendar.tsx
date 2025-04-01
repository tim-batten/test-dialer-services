/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
import {
  Button,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
} from '@material-ui/core';
import FilterListIcon from '@material-ui/icons/FilterList';
import moment from 'moment-timezone';
import React, { useEffect, useState } from 'react';
import { Calendar as RCalendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useContextMenu } from 'react-contexify';
import { TopLabeledTextField } from '../../..';
import { MomentTimeZOnes } from '../../../commons/assets/TimeZones';
import { IAccounts, IDateRange } from '../../../commons/types/commonTypes';
import { IHolidayID } from '../../../commons/types/holidayTypes';
import { IEnableReason, ModType } from '../../../commons/types/schedulerTypes';
import { CustomTextField } from '../SchedulerMainView.Styles';
import { CalendarWrapper, FieldWrapper, Wrapper } from './Calendar.Styles';
import { CalendarToolBar } from './CalendarToolBar';
import { ContextMenu } from './ContextMenu';
import { CustomEvent } from './CustomEvent';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import {
  baseURL,
  isBaseURLAll,
  set_config_baseURL,
} from '../../../../api/utils';
import { ICampaign, Schedule } from '../../../commons/types/campaignTypes';
import { IDialerDefaults } from '../../../commons/types/globalTypes';
import {
  HolidayResponse,
  HolidayTime,
  ScheduleApiResponse,
  ScheduleOccurrenceInfo,
  ScheduleWithOcurrenceInfo,
} from 'navient-common/lib/types/schedules-api';
import { PrjAccd } from '../../../../types/prjacc';
import { ScheduleDefinition } from 'navient-common/lib/models/schedule';
import { HolidayDefinition } from 'navient-common/lib/models/holiday';
import { MultiAccountConfig } from '../../../../window-env';

interface ICalendar {
  handleSideBar: () => void;
  openSidebar: boolean;
  scheduleEvents: {
    schedules: PrjAccd<ScheduleWithOcurrenceInfo>[];
    holidays: PrjAccd<HolidayResponse>[];
  };
  dialerDefaults: IDialerDefaults;
  selectedAccount: IAccounts | undefined | 'All';
  onEnable: (
    data_id: string,
    date: string,
    type: ModType,
    enable: boolean,
    reason: IEnableReason | undefined,
  ) => void;
  onEdit: (
    data_id: string,
    data: { start: Date; end: Date },
    type: ModType,
  ) => void;
  onView: (
    data_id: string,
    data: { start: Date; end: Date },
    type: ModType,
  ) => void;
  onCopy: (
    data_id: string,
    data: { start: Date; end: Date },
    type: ModType,
  ) => void;
  onHolidayEdit: (holiday: PrjAccd<IHolidayID>) => void;
  onTimeZoneChange?: (timezone: string) => void;
  getSchedulesBetweenTimes: (todayStart: Date, todayEnd: Date) => void;
  campaigns: ICampaign[];
  campaignGroups: any;
  schedulesBetweenTimes: ScheduleWithOcurrenceInfo[];
  onRangeChange: (dateRange: IDateRange) => void;
  onExport: (data_id: string) => void;
}

const calendarViews = ['month', 'day', 'work_week', 'week', 'agenda'] as const;
type CalendarView = typeof calendarViews[number];
const IsCalendarView = (view: string | null): view is CalendarView =>
  calendarViews.includes(view as any);

const MENUID = 'myeventcontextmenu';

const { show } = useContextMenu({
  id: MENUID,
});

type ScheduleEvent = {
  id: number;
  data_id: string;
  title: string;
  isHoliday: boolean;
  isEnabled: boolean;
  disabledReason?: string;
  disablingEntityName?: string;
  disabledOccurrence: boolean;
  campaignId: string;
  allDay: boolean;
  start: Date;
  end: Date;
  occurrenceType: 'single' | 'series';
  configTimeZone: string | undefined;
  timeZone: string;
  status?: string;
  prjacc?: MultiAccountConfig;
};

export const Calendar: React.FunctionComponent<ICalendar> = ({
  selectedAccount,
  handleSideBar,
  openSidebar,
  scheduleEvents,
  dialerDefaults,
  onEnable,
  onEdit,
  onView,
  onCopy,
  campaigns,
  campaignGroups,
  onTimeZoneChange,
  schedulesBetweenTimes,
  getSchedulesBetweenTimes,
  onRangeChange,
  onHolidayEdit,
  onExport,
}) => {
  const date = new Date(),
    y = date.getFullYear(),
    m = date.getMonth();

  // tz.tz.setDefault('America/New_York');
  const [localizer, setLocalizer] = useState(momentLocalizer(moment));

  const [events, setEvents] = useState<any[]>([]);
  const [timeZone, setTimeZone] = useState(moment.tz.guess());
  const [dateRange, setDateRange] = useState<IDateRange>({
    start: new Date(y, m, 1),
    end: new Date(y, m + 1, 6),
  });

  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [filterName, setFilterName] = useState<string>('Schedule Name');
  const [filterTarget, setFilterTarget] = useState<string>('');

  const [sEvent, setSEvent] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [reasonID, setReasonID] = useState<{
    reason: IEnableReason;
    id: string;
  }>();

  const defaultCalendarViewStr = localStorage.getItem('navient-scheduler-view');
  const defaultCalendarView = IsCalendarView(defaultCalendarViewStr)
    ? defaultCalendarViewStr
    : 'month';

  useEffect(() => {
    const events = scheduleEvents.schedules.reduce(
      (acc: ScheduleEvent[], val) => {
        const schedule = val.schedule;
        const configTimeZone = val.scheduleTimezone;
        const occurrenceType = schedule.Occurrence?.Single
          ? 'single'
          : 'series';
        const _events: ScheduleEvent[] = val.occurrences.map((e) => {
          return {
            id: Date.now() + Math.random(),
            data_id: schedule.id,
            title: schedule.ScheduleName,
            isHoliday: false,
            isEnabled: !e?.disabled,
            disabledReason: e?.disabledReason,
            disablingEntityName: e?.disablingEntityName,
            disabledOccurrence: !!(e?.disabled && !schedule.Disabled),
            campaignId: schedule.CampaignId,
            allDay: false,
            start: new Date(e.start),
            end: new Date(e.end),
            occurrenceType,
            configTimeZone,
            timeZone,
            status: e.status,
            prjacc: val.prjacc,
          };
        });

        return acc.concat(_events);
      },
      [],
    );

    const holidays = scheduleEvents.holidays.reduce(
      (acc: ScheduleEvent[], val) => {
        const holiday = val.holiday;
        const configTimeZone = dialerDefaults.ScheduleTimezone;
        const occurrenceType = 'single';
        const _events: ScheduleEvent[] = val.times.map((e) => {
          return {
            id: Date.now() + Math.random(),
            data_id: holiday.id,
            title: holiday.HolidayName,
            isHoliday: true,
            isEnabled: true,
            disabledOccurrence: false,
            campaignId: '',
            allDay: true,
            start: new Date(e.start),
            end: new Date(e.end),
            occurrenceType,
            configTimeZone,
            timeZone,
            prjacc: val.prjacc,
          };
        });

        return acc.concat(_events);
      },
      [],
    );

    setEvents(events.concat(holidays));
  }, [scheduleEvents, timeZone]);

  useEffect(() => {
    getSchedulesBetweenTimes(dateRange?.start, dateRange?.end);
    onRangeChange(dateRange);
  }, [dateRange, selectedAccount]);

  const handleHolidayView = () => {
    const holidays: any[] = events.filter(
      (event: any) => event.isHoliday === true,
    );
    // setEvents(holidays)
  };
  const handleFilterMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchor(event.currentTarget);
  };
  const handleCloseFilter = () => {
    setFilterAnchor(null);
  };

  const eventFilter = (filterMode) => {
    const lowerTarget = filterTarget.toLowerCase();
    switch (filterMode) {
      case 'Schedule Name':
        return events.filter((event: any) => {
          return event.title?.toLowerCase().indexOf(lowerTarget) !== -1;
        });
      case 'Campaign Name':
        return events.filter((event: any) => {
          const eventCampaign = campaigns.find((camp) => {
            return camp && camp.id === event.campaignId;
          });
          return (
            eventCampaign?.CampaignName?.toLowerCase().indexOf(lowerTarget) !==
            -1
          );
        });
      case 'Campaign Group':
        return events.filter((event: any) => {
          const singleSchedule = scheduleEvents.schedules.find((sched) => {
            return sched && sched.schedule.id === event.data_id;
          });

          const singleGroup = campaignGroups.find((group) => {
            return group.id === singleSchedule?.campaignGroupId;
          });

          return singleGroup?.name?.toLowerCase().indexOf(lowerTarget) !== -1;
        });
      case 'Holidays':
        return events.filter((event: any) => {
          return event.isHoliday === true;
        });
      default:
        return events;
    }
  };

  const handleTimeZoneChange = (timezone: string) => {
    setTimeZone(timezone);
    moment.tz.setDefault(timezone);
    setLocalizer(momentLocalizer(moment));
    onTimeZoneChange && onTimeZoneChange(timezone);
  };
  const holidayFilter = (holidayStatus) => {
    holidayStatus ? setFilterName('Holidays') : setFilterName('Schedule Name');
  };
  const changeDateRange = (startDate, endDate) => {
    let startRange = new Date(startDate.replace(/-/g, '/'));
    let endRange = new Date(endDate.replace(/-/g, '/'));

    startRange.setHours(0);
    startRange.setMinutes(0);
    startRange.setMinutes(0);
    endRange.setHours(23);
    endRange.setMinutes(59);
    endRange.setMinutes(59);
    if (startDate !== '' && endDate !== '') {
      setDateRange({ start: startRange, end: endRange });
    }
    if (startDate === '' && endDate !== '') {
      setDateRange({ start: dateRange.start, end: endRange });
    }
    if (endDate === '' && startDate !== '') {
      setDateRange({ start: startRange, end: dateRange.end });
    }
  };

  return (
    <Wrapper>
      <CalendarWrapper>
        <FieldWrapper>
          <CustomTextField
            size='small'
            label={`Filter by ${filterName}`}
            placeholder={`Filter by ${filterName}`}
            variant='outlined'
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <Tooltip title='Change Filter Criteria' placement='top'>
                    <IconButton onClick={handleFilterMenu}>
                      <FilterListIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            onChange={(e) => setFilterTarget(e.target.value)}
          />
          <Menu
            id='filter-menu'
            open={Boolean(filterAnchor)}
            keepMounted
            anchorEl={filterAnchor}
            onClose={handleCloseFilter}
          >
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Schedule Name');
              }}
            >
              Schedule Name{' '}
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Campaign Name');
              }}
            >
              Campaign Name
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Campaign Group');
              }}
            >
              Campaign Group
            </MenuItem>
          </Menu>
          <TopLabeledTextField
            value={timeZone}
            label=''
            placeholder='Time Zone'
            select
            width={300}
            onChange={(e) => handleTimeZoneChange(e.target.value)}
          >
            {MomentTimeZOnes.map((tz) => (
              <MenuItem value={tz}>{tz}</MenuItem>
            ))}
          </TopLabeledTextField>
        </FieldWrapper>
        <RCalendar
          dayLayoutAlgorithm='no-overlap'
          onView={(view) => {
            localStorage.setItem('navient-scheduler-view', view);
          }}
          defaultView={defaultCalendarView}
          eventPropGetter={(
            event: ScheduleEvent,
            // start: stringOrDate,
            // end: stringOrDate,
            // isSelected: boolean,
          ) => {
            let backgroundColor;
            if (event.isHoliday) {
              backgroundColor = 'rgba(179,96,55, 0.65)';
            } else if (!event.isEnabled) {
              backgroundColor = 'rgba(211,211,211, 0.65)';
            } else if (event?.status === 'FINISHED') {
              backgroundColor = 'rgba(111,63,137, 0.65)';
            } else if (event?.status === 'RUNNING') {
              backgroundColor = 'rgba(0,87,184, 0.65)';
            } else backgroundColor = 'rgba(0,173,239, 0.45)';
            let newStyle = {
              backgroundColor,
              color: 'black',
              borderRadius: '0px',
            };

            return {
              className: '',
              style: newStyle,
            };
          }}
          views={{
            month: true,
            day: true,
            work_week: true,
            week: true,
            agenda: true,
          }}
          popup
          localizer={localizer}
          defaultDate={new Date()}
          events={eventFilter(filterName)}
          startAccessor='start'
          endAccessor='end'
          showMultiDayTimes
          components={{
            toolbar: (t) => (
              <CalendarToolBar
                {...t}
                dateRange={dateRange}
                handleSideBar={() => handleSideBar()}
                openSidebar={openSidebar}
                holidayFilter={holidayFilter}
                handleHolidayView={handleHolidayView}
                changeDateRange={(startDate, endDate) =>
                  changeDateRange(startDate, endDate)
                }
                setFilter={(name) => setFilterName(name)}
              />
            ),
            event: (_e) => <CustomEvent event={_e} />,
          }}
          length={31}
          onRangeChange={(data: any, view) => {
            if (data.start) {
              setDateRange({ start: data.start, end: data.end });
            } else if (data.length === 1) {
              const startDay = data[0];
              const copyDay = new Date(startDay.getTime());
              copyDay.setHours(23);
              copyDay.setMinutes(59);
              copyDay.setSeconds(59);
              setDateRange({ start: startDay, end: copyDay });
            } else {
              const end: Date = data[data.length - 1];
              end.setHours(23);
              end.setMinutes(59);
              end.setSeconds(59);
              setDateRange({ start: data[0], end: end });
            }
          }}
          onSelectEvent={(event, e: any) => {
            setSEvent(event);
            show(e);
          }}
        />
      </CalendarWrapper>
      <ContextMenu
        menuID={MENUID}
        event={sEvent}
        onEnable={(
          data_id: string,
          date: string,
          type: ModType,
          enable: boolean,
          reason: IEnableReason | undefined,
        ) => {
          const sched = scheduleEvents.schedules.find(
            (s) => s.schedule.id === data_id,
          );
          if (sched) {
            if (isBaseURLAll() && sched.prjacc) {
              set_config_baseURL(sched.prjacc.url);
            }
          }
          if (!reason || reason.disabledReason === 'disabled') {
            onEnable(data_id, date, type, enable, reason);
          } else {
            setOpenDialog(true);
            setReasonID({ id: data_id, reason });
          }
        }}
        onEdit={(data_id, data, type) => onEdit(data_id, data, type)}
        onView={(data_id, data, type) => onView(data_id, data, type)}
        onCopy={(data_id, data, type) => onCopy(data_id, data, type)}
        onHolidayEdit={(data_id) => {
          const holiday = scheduleEvents.holidays.find(
            (h) => h.holiday.id === data_id,
          );
          if (holiday) {
            if (isBaseURLAll()) {
              onHolidayEdit({ ...holiday.holiday, prjacc: holiday?.prjacc });
            } else {
              onHolidayEdit(holiday.holiday);
            }
          }
        }}
        onExport={(data_id) => onExport(data_id)}
      />

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby='alert-delete'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-delete'>Do you want to continue?</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Enabling this occurrence will result to transforming it into single
            occurring event, do you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color='primary'>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (reasonID) {
                onEnable(
                  reasonID.id,
                  reasonID.reason.date,
                  'occurrence',
                  true,
                  reasonID.reason,
                );
                setOpenDialog(false);
              }
            }}
            color='primary'
            autoFocus
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Wrapper>
  );
};
