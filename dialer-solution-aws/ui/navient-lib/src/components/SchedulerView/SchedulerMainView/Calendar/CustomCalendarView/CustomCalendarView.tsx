import React from 'react';
import { Wrapper } from './CustomCalendarView.Styles';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Calendar as CustomCalendar,
  momentLocalizer,
  ViewProps,
} from 'react-big-calendar';
import tz from 'moment-timezone';

type TCustomCalendar = ViewProps & {};

export const CustomCalendarView: React.FunctionComponent<TCustomCalendar> = (
  props,
) => {
  const localizer = momentLocalizer(tz);
  props.onNavigate();
  return (
    <Wrapper>
      <CustomCalendar
        views={{ agenda: true }}
        popup
        localizer={localizer}
        defaultDate={new Date(2021, 10, 5, 2)}
        startAccessor='start'
        endAccessor='end'
        showMultiDayTimes
      />
    </Wrapper>
  );
};

CustomCalendarView.defaultProps = {
  // bla: 'test',
};
