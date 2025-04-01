/* eslint-disable no-empty-pattern */
import React from 'react';
import { StyledMenu } from './ContextMenu.Styles';
import 'react-contexify/dist/ReactContexify.css';
import { Item, Menu, Separator, Submenu } from 'react-contexify';
import {
  IEnableReason,
  ModType,
} from '../../../../commons/types/schedulerTypes';
import { Tooltip } from '@material-ui/core';
import {
  convertTimeZone,
  getConvertedTimeZoneInUTC,
  toDateString,
} from '../../../../commons/utils/DateFormatter';
import moment from 'moment-timezone';

interface IContextMenu {
  menuID: string;
  event: any;
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
  onHolidayEdit: (data_id: string) => void;
  onExport: (data_id: string) => void;
}

export const ContextMenu: React.FunctionComponent<IContextMenu> = ({
  menuID,
  event,
  onEnable,
  onEdit,
  onView,
  onCopy,
  onHolidayEdit,
  onExport
}) => {
  const occurrenceType = event?.occurrenceType;
  const startDate = new Date(event?.start);
  const endDate = new Date(event?.end);
  return (
    <StyledMenu id={menuID}>
      {/* TODO: Some kind of check for whether there ARE more occurrences than 1. If yes, then below is good. If no, we can only offer "occurrence" in the submenu */}
      {!event?.isHoliday ? (
        <>
          <Submenu label='Edit'>
            <Tooltip title='' placement='top'>
              <Item
                disabled={occurrenceType === 'single'}
                onClick={(e) => {
                  const start = event?.start;
                  const end = event?.end;

                  onEdit(event?.data_id, { start, end }, 'occurrence');
                }}
              >
                Occurrence
              </Item>
            </Tooltip>
            <Item
              onClick={(e) => {
                const start = event?.start;
                const end = event?.end;
                onEdit(event?.data_id, { start, end }, 'series');
              }}
            >
              Series
            </Item>
          </Submenu>
          <Submenu label='Copy'>
            <Tooltip title='' placement='top'>
              <Item
                disabled={occurrenceType === 'single'}
                onClick={(e) => {
                  const start = event?.start;
                  const end = event?.end;

                  onCopy(event?.data_id, { start, end }, 'occurrence');
                }}
              >
                Occurrence
              </Item>
            </Tooltip>
            <Item
              onClick={(e) => {
                const start = event?.start;
                const end = event?.end;
                onCopy(event?.data_id, { start, end }, 'series');
              }}
            >
              Series
            </Item>
          </Submenu>
          <Separator />
          <Submenu label={event?.isEnabled === true ? 'Disable' : 'Enable'}>
            <Tooltip title='' placement='top'>
              <Item
                disabled={
                  occurrenceType === 'single' ||
                  (!event?.isEnabled && !event?.disabledOccurrence)
                }
                onClick={(e) => {
                  const date = toDateString(
                    new Date(
                      convertTimeZone(
                        startDate,
                        moment.tz.guess(),
                        event?.configTimeZone || event?.timeZone,
                      ),
                    ),
                  );

                  onEnable(
                    event?.data_id,
                    date,
                    'occurrence',
                    !event?.isEnabled,
                    event?.disabledReason && {
                      date: new Date(event.start).toISOString(),
                      disabledReason: event.disabledReason,
                    },
                  );
                }}
              >
                Occurrence
              </Item>
            </Tooltip>
            <Item
              disabled={!event?.isEnabled && event?.disabledOccurrence}
              onClick={(e) => {
                const date = toDateString(startDate);
                onEnable(
                  event?.data_id,
                  date,
                  'series',
                  !event?.isEnabled,
                  undefined,
                );
              }}
            >
              Series
            </Item>
          </Submenu>
          <Separator />
          <Submenu label='View'>
            <Tooltip title='' placement='top'>
              <Item
                disabled={occurrenceType === 'single'}
                onClick={(e) => {
                  const start = event?.start;
                  const end = event?.end;

                  onView(event?.data_id, { start, end }, 'occurrence');
                }}
              >
                Occurrence
              </Item>
            </Tooltip>
            <Item
              onClick={(e) => {
                const start = event?.start;
                const end = event?.end;
                onView(event?.data_id, { start, end }, 'series');
              }}
            >
              Series
            </Item>
          </Submenu>
          {/* <Item disabled>Disabled</Item> */}
          <Item
            onClick={(e) => {
              onExport(event?.data_id);
            }}
          >
            Export
          </Item>
        </>
      ) : (
        <>
          <Tooltip title='' placement='top'>
            <Item
              onClick={(e) => {
                onHolidayEdit(event?.data_id);
              }}
            >
              Edit
            </Item>
          </Tooltip>
        </>
      )}
    </StyledMenu>
  );
};

ContextMenu.defaultProps = {
  // bla: 'test',
};
