import { Checkbox, FormControlLabel, MenuItem } from '@material-ui/core';
import { Field } from 'formik';
import React, { useEffect, useState } from 'react';
import { TopLabeledTextField } from '../../..';
import { MomentTimeZOnes } from '../../../commons/assets/TimeZones';
import { CustomAutoCompleteField } from '../../../commons/CustomAutoCompleteField';
import { CustomTextField } from '../../../commons/CustomTextField';
import { nth } from '../../../commons/utils/NumberUtils';
import { CustomFormikWeekCheckbox } from './CustomFormikWeekCheckbox';
import {
  RecurrenceWrapper,
  TextGroupWrapper,
  TextWrapper,
  Wrapper,
} from './Schedule.Styles';

interface ISchedule {
  values: any;
  setFieldValue: Function;
  touched: any;
  errors: any;
}

export const Schedule: React.FunctionComponent<ISchedule> = ({
  values,
  setFieldValue,
  errors,
  touched,
}) => {
  const recurrenceType = values.recurrence.type;
  const [doesEnd, setDoesEnd] = [
    values.doesEnd,
    (val: boolean) => setFieldValue(`doesEnd`, val),
  ];
  const [monthPattern, setMonthPattern] = useState('day');

  useEffect(() => {
    setMonthPattern(
      values.recurrence?.misc?.dow ? 'nth day of the week' : 'day',
    );
  }, [values]);

  const renderRecurrenceComp = (recurrence: string) => {
    if (recurrence === 'weekly') {
      return (
        <Wrapper>
          <Field component={CustomFormikWeekCheckbox} name='recurrence.misc' />
        </Wrapper>
      );
    } else if (recurrence === 'monthly') {
      const days = Array.apply(0, Array(31)).map((_: any, i: number) => i + 1);
      return (
        <>
          <TopLabeledTextField
            label='Monthly Pattern'
            value={monthPattern}
            select
            fullWidth
            onChange={(e) => {
              setMonthPattern(e.target.value);
              if (e.target.value === 'day') {
                setFieldValue('recurrence.misc.dow', null);
              } else {
                setFieldValue('recurrence.misc.dow', 'MO');
                setFieldValue('recurrence.misc.day', 1);
              }
            }}
          >
            <MenuItem value='day'>Days</MenuItem>
            <MenuItem value='nth day of the week'>Nth Day of the Week</MenuItem>
          </TopLabeledTextField>
          <CustomTextField
            label={monthPattern === 'day' ? 'On Day' : 'Order'}
            name='recurrence.misc.day'
            select
            fullWidth
            SelectProps={{
              multiple: monthPattern === 'day',
              value:
                monthPattern === 'day'
                  ? values?.recurrence?.misc?.day?.length > 0
                    ? values?.recurrence?.misc.day
                    : [1]
                  : values?.recurrence?.misc.day || 1,
              onChange: (e) =>
                setFieldValue('recurrence.misc', {
                  ...values.recurrence.misc,
                  day: e.target.value,
                }),
            }}
          >
            {monthPattern === 'day'
              ? days.map((d: any) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))
              : [1, 2, 3, 4, 5].map((d: any) => (
                  <MenuItem key={d} value={d}>
                    {d + nth(d)}
                  </MenuItem>
                ))}
          </CustomTextField>

          {monthPattern !== 'day' && (
            <CustomTextField
              label='Week Day'
              name='recurrence.misc.dow'
              select
              fullWidth
              SelectProps={{
                value: values?.recurrence?.misc?.dow || 'MO',
                onChange: (e) => {
                  setFieldValue('recurrence.misc', {
                    ...values.recurrence.misc,
                    dow: e.target.value,
                  });
                },
              }}
            >
              <MenuItem value='MO'>Monday</MenuItem>
              <MenuItem value='TU'>Tuesday</MenuItem>
              <MenuItem value='WE'>Wednesday</MenuItem>
              <MenuItem value='TH'>Thursday</MenuItem>
              <MenuItem value='FR'>Friday</MenuItem>
              <MenuItem value='SA'>Saturday</MenuItem>
              <MenuItem value='SU'>Sunday</MenuItem>
            </CustomTextField>
          )}
        </>
      );
    } else {
      return null;
    }
  };
  return (
    <Wrapper>
      <TextGroupWrapper>
        <CustomAutoCompleteField
          options={MomentTimeZOnes.map((m) => ({ value: m, label: m }))}
          // options={[
          //   {
          //     value: `${global.DialerDefaults.ScheduleTimezone}`,
          //     label: `${global.DialerDefaults.ScheduleTimezone}`,
          //   },
          // ]}
          name='timeZone'
          label='Timezone'
          placeholder='Please Select'
          disabled
          fullWidth
        />

        <TextWrapper>
          <CustomTextField
            name='startTime'
            label='Start Time'
            type='time'
            fullWidth
          />
          <CustomTextField
            name='endTime'
            label='End Time'
            type='time'
            fullWidth
          />
        </TextWrapper>
        <TextWrapper>
          <CustomTextField
            label='Recurrence Pattern'
            name='recurrence.type'
            select
            fullWidth
            onChange={(e) => {
              setFieldValue(e.target.name, e.target.value);
              if (e.target.value === 'monthly') {
                setFieldValue(`recurrence.misc.day`, 1);
                setMonthPattern('day');
              } else if (e.target.value === 'weekly') {
                setFieldValue(`recurrence.misc`, []);
              } else {
                setFieldValue(`recurrence.misc`, '');
                setDoesEnd(true);
              }
            }}
          >
            <MenuItem value='doesNotRepeat'>Does not repeat</MenuItem>
            <MenuItem value='daily'>Daily</MenuItem>
            <MenuItem value='weekly'>Weekly</MenuItem>
            <MenuItem value='monthly'>Monthly</MenuItem>
          </CustomTextField>
          {renderRecurrenceComp(recurrenceType)}
          {recurrenceType !== 'doesNotRepeat' && (
            <RecurrenceWrapper>
              <CustomTextField
                name='recurrence.value'
                label='Every'
                type='number'
                fullWidth
                inputProps={{ min: 1 }}
              />
              <span>
                {recurrenceType === 'daily'
                  ? 'Day(s)'
                  : recurrenceType === 'weekly'
                  ? 'Weeks(s)'
                  : recurrenceType === 'monthly'
                  ? 'Month(s)'
                  : null}
              </span>
            </RecurrenceWrapper>
          )}
        </TextWrapper>
        <CustomTextField
          name='startDate'
          label='Start Date'
          type='date'
          fullWidth
          onChange={(e) => {
            if (recurrenceType === 'doesNotRepeat') {
              setFieldValue('endDate', e.target.value);
            }
            setFieldValue(e.target.name, e.target.value);
          }}
        />
        {recurrenceType !== 'doesNotRepeat' && (
          <FormControlLabel
            control={
              <Checkbox
                checked={values.doesEnd}
                onChange={(e) => {
                  setDoesEnd(e.target.checked);
                }}
                name='checkedF'
                disabled={recurrenceType === 'doesNotRepeat'}
              />
            }
            label='Does End'
          />
        )}

        {doesEnd && recurrenceType !== 'doesNotRepeat' && (
          <CustomTextField
            name='endDate'
            label='End Date'
            type='date'
            fullWidth
          />
        )}
      </TextGroupWrapper>
    </Wrapper>
  );
};

Schedule.defaultProps = {
  // bla: 'test',
};
