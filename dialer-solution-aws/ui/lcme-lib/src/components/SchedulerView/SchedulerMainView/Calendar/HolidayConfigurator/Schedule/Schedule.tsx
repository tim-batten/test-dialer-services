import { MenuItem } from '@material-ui/core';
import { Field } from 'formik';
import React from 'react';
import { timeZones } from '../../../../../commons/assets/TimeZones';
import { CustomAutoCompleteField } from '../../../../../commons/CustomAutoCompleteField';
import { CustomTextField } from '../../../../../commons/CustomTextField';
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
}) => {
  const recurrenceType = values.recurrence.type;

  const renderRecurrenceComp = (recurrence: string) => {
    if (recurrence === 'weekly') {
      return (
        <Field component={CustomFormikWeekCheckbox} name='recurrence.misc' />
      );
    } else if (recurrence === 'monthly') {
      const days = Array.apply(0, Array(31)).map((_: any, i: number) => i + 1);
      return (
        <CustomTextField label='On Day' name='recurrence.misc' select fullWidth>
          {days.map((d: any) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </CustomTextField>
      );
    } else {
      return null;
    }
  };
  return (
    <Wrapper>
      <TextGroupWrapper>
        <CustomAutoCompleteField
          options={timeZones}
          name='timeZone'
          label='Timezone'
          placeholder='Please Select'
          disabled
          fullWidth
        />
        <CustomTextField
          name='startDate'
          label='Start Date'
          type='date'
          fullWidth
        />
        <TextWrapper>
          <CustomTextField
            label='Repeat'
            name='recurrence.type'
            select
            fullWidth
            onChange={(e) => {
              setFieldValue(e.target.name, e.target.value);
              if (e.target.value === 'monthly') {
                setFieldValue(`recurrence.misc`, 1);
              } else if (e.target.value === 'weekly') {
                setFieldValue(`recurrence.misc`, []);
              } else {
                setFieldValue(`recurrence.misc`, '');
              }
            }}
          >
            <MenuItem value='doesNotRepeat'>Does not repeat</MenuItem>
            <MenuItem value='daily'>Daily</MenuItem>
            <MenuItem value='weekly'>Weekly</MenuItem>
            <MenuItem value='monthly'>Monthly</MenuItem>
          </CustomTextField>
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
        {renderRecurrenceComp(recurrenceType)}
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
        <CustomTextField
          name='endDate'
          label='End Date'
          type='date'
          fullWidth
        />
      </TextGroupWrapper>
    </Wrapper>
  );
};

Schedule.defaultProps = {
  // bla: 'test',
};
