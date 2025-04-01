/* eslint-disable no-unused-vars */
import {
  Button,
  IconButton,
  TextField,
  Divider,
  MenuItem,
  Typography,
  Tooltip,
} from '@material-ui/core';
import { ArrowBackIos, ArrowForwardIos, DateRange } from '@material-ui/icons';
import EventBusyOutlinedIcon from '@material-ui/icons/EventBusyOutlined';
import RedeemIcon from '@material-ui/icons/Redeem';
import React, { useEffect, useState } from 'react';
import { ToolbarProps, View } from 'react-big-calendar';
import {
  NavigationWrapper,
  RightWrapper,
  StyledTextField,
  Wrapper,
} from './CalendarToolBar.Styles';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import ViewListIcon from '@material-ui/icons/ViewList';

type TCalendarToolBar = ToolbarProps & {
  handleSideBar: Function;
  openSidebar: boolean;
  handleHolidayView: Function;
  dateRange: any;
  changeDateRange: (startDate, endDate) => void;
  holidayFilter: Function;
  setFilter: (name) => void;
};

export const CalendarToolBar: React.FunctionComponent<TCalendarToolBar> = (
  props,
) => {
  const [, updateState] = React.useState({});
  const forceUpdate = React.useCallback(() => updateState({}), []);
  const [agendaView, setAgendaView] = React.useState(false);
  const [openDate, setOpenDate] = useState(false);
  const [holidayStatus, setHolidayStatus] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formats, setFormats] = useState(() => ['holiday']);

  const goToBack = () => {
    props.onNavigate('PREV');
  };
  const goToNext = () => {
    props.onNavigate('NEXT');
    const localizer: any = props.localizer;
  };
  const goToCurrent = () => {
    props.onNavigate('TODAY');
  };
  useEffect(() => {
    if (props.view === 'agenda') {
      setAgendaView(true);
    } else {
      setAgendaView(false);
    }
  }, [agendaView]);

  const handleViewChange = (value: string) => {
    props.onView(value as View);
  };

  const handleClose = () => {
    setOpenDate(false);
  };
  const handleToggleChange = () => {
    setHolidayStatus(!holidayStatus);
  };

  const setAgendaInterval = (startDate, endDate) => {
    props.changeDateRange(startDate, endDate);

    if (startDate) {
      props.onNavigate('DATE', new Date(startDate.replace(/-/g, '/')));
      props.changeDateRange(startDate, endDate);
    }

    handleClose();
  };

  return (
    <Wrapper>
      <NavigationWrapper>
        <IconButton color='primary' onClick={() => goToBack()}>
          <ArrowBackIos />
        </IconButton>
        <Button onClick={() => goToCurrent()} color='primary'>
          Today
        </Button>
        <IconButton color='primary' onClick={() => goToNext()}>
          <ArrowForwardIos />
        </IconButton>
        {agendaView ? (
          <Tooltip title='Set Interval' placement='top'>
            <IconButton
              color='primary'
              onClick={() => {
                setOpenDate(true);
              }}
            >
              <DateRange />
            </IconButton>
          </Tooltip>
        ) : null}
        <Tooltip title='Holidays Only' placement='top'>
          <IconButton
            color='primary'
            onClick={() => {
              props.setFilter('Holidays');
            }}
          >
            <RedeemIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='All Events' placement='top'>
          <IconButton
            color='primary'
            onClick={() => {
              props.setFilter('Schedule Name');
            }}
          >
            <ViewListIcon />
          </IconButton>
        </Tooltip>
      </NavigationWrapper>

      <Dialog
        open={openDate}
        onClose={() => handleClose()}
        aria-labelledby='alert-date'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-date'>Date Interval</DialogTitle>
        <DialogContent>
          <TextField
            id='date'
            label='Start Date'
            defaultValue={new Date(props.dateRange.start).toLocaleDateString(
              'en-CA',
            )}
            type='date'
            onChange={(e) => {
              setStartDate(e.target.value);
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogContent>
          <TextField
            id='date'
            label='End Date'
            defaultValue={new Date(props.dateRange.end).toLocaleDateString(
              'en-CA',
            )}
            type='date'
            onChange={(e) => {
              setEndDate(e.target.value);
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAgendaInterval(startDate, endDate)}
            color='primary'
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {agendaView ? (
        <Typography variant='h6'>{`${new Date(
          props.dateRange.start,
        ).toLocaleDateString()} - ${new Date(
          props.dateRange.end,
        ).toLocaleDateString()}`}</Typography>
      ) : (
        <Typography variant='h6'>{props.label}</Typography>
      )}
      <RightWrapper>
        <StyledTextField
          select
          margin='dense'
          value={props.view}
          onChange={(e) => handleViewChange(e.target.value)}
        >
          {(props.views as string[]).map((value) => (
            <MenuItem key={value} value={value}>
              {value.toUpperCase().replace(/_/g, ' ')}
            </MenuItem>
          ))}
        </StyledTextField>
        <Tooltip title='Manage Holidays' placement='top'>
          <IconButton
            disabled={props.openSidebar}
            onClick={() => props.handleSideBar()}
          >
            <EventBusyOutlinedIcon />
          </IconButton>
        </Tooltip>
      </RightWrapper>
    </Wrapper>
  );
};

CalendarToolBar.defaultProps = {
  // bla: 'test',
};
