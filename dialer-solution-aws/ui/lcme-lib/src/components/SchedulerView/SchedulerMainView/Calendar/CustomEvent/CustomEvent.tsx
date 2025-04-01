/* eslint-disable no-unused-vars */
import { DateRange, Event } from '@material-ui/icons';
import moment from 'moment-timezone';
import React from 'react';
import 'react-contexify/dist/ReactContexify.css';
import {
  convertTimeZone,
  toSTime,
} from '../../../../commons/utils/DateFormatter';
import { EventWrapper, ShortCodeWrapper } from './CustomEvent.Styles';

interface ICustomEvent {
  event: any;
}

export const CustomEvent: React.FunctionComponent<ICustomEvent> = ({
  event,
}) => {
  const occurrenceType = event.event.occurrenceType;

  const title = (): string => {
    let title = '';
    let start = new Date(
      convertTimeZone(
        event.event.start,
        moment.tz.guess(),
        event.event.timeZone,
      ),
    );

    let end = new Date(
      convertTimeZone(event.event.end, moment.tz.guess(), event.event.timeZone),
    );

    if (event) {
      title = `${toSTime(start)} ${event.title}`;
    }

    return title;
  };

  const shortCode = () =>
    event.event.prjacc ? event.event.prjacc.shortCode : '';

  const colorCode = () => (event.event.prjacc ? event.event.prjacc.color : '');
  return (
    <EventWrapper>
      <div>
        {occurrenceType === 'single' ? (
          <Event style={{ fontSize: 10 }} />
        ) : (
          <DateRange style={{ fontSize: 10 }} />
        )}
      </div>
      <p>
        {event.event.prjacc && (
          <ShortCodeWrapper color={colorCode()}>
            {' '}
            {`${shortCode()}: `}
          </ShortCodeWrapper>
        )}
        {`${title()}`}
      </p>
    </EventWrapper>
  );
};
