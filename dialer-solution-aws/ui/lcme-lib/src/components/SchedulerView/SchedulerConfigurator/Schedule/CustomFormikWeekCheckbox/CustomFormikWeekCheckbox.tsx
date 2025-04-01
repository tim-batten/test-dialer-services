/* eslint-disable no-unused-vars */
import { Checkbox } from '@material-ui/core';
import { TextFieldProps } from 'formik-material-ui';
import React, { useEffect, useState } from 'react';
import { multipleStringAccessorExtractor } from '../../../../commons/utils/JSONUtils';
import {
  CheckBoxWrapper,
  CompactFormControlLabel,
  CustomHelperText,
  Wrapper,
} from './CustomFormikWeekCheckbox.Styles';

interface FieldProps {
  value: any;
  label: string;
}

type ICustomFormikWeekCheckbox = TextFieldProps & {
  fields: FieldProps[];
  row?: boolean;
};
export const CustomFormikWeekCheckbox: React.FunctionComponent<
  ICustomFormikWeekCheckbox
> = ({ form, field, label }) => {
  const [state, setState] = useState({
    sunday: false,
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
  });

  const errorValue = multipleStringAccessorExtractor(field.name, form.errors);
  const willError = !!errorValue;

  useEffect(() => {
    const days = field.value;

    if (days && days.length > 0) {
      setState({
        sunday: !!days?.find((day) => day === 'sunday'),
        monday: !!days?.find((day) => day === 'monday'),
        tuesday: !!days?.find((day) => day === 'tuesday'),
        wednesday: !!days?.find((day) => day === 'wednesday'),
        thursday: !!days?.find((day) => day === 'thursday'),
        friday: !!days?.find((day) => day === 'friday'),
        saturday: !!days?.find((day) => day === 'saturday'),
      });
    }
  }, [field.value]);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const _state = { ...state, [event.target.name]: event.target.checked };
    setState(_state);
    const selectedDays = Object.entries(_state)
      .filter((e) => e[1])
      .map((e) => e[0]);
    form.setFieldValue(field.name, selectedDays);
  };
  return (
    <Wrapper>
      <CustomHelperText>{label}</CustomHelperText>
      <CheckBoxWrapper>
        <CompactFormControlLabel
          value='sunday'
          control={
            <Checkbox
              name='sunday'
              checked={state.sunday}
              onChange={handleChange}
            />
          }
          label='S'
          labelPlacement='top'
        />
        <CompactFormControlLabel
          value='monday'
          control={
            <Checkbox
              name='monday'
              checked={state.monday}
              onChange={handleChange}
            />
          }
          label='M'
          labelPlacement='top'
        />
        <CompactFormControlLabel
          value='tuesday'
          control={
            <Checkbox
              name='tuesday'
              checked={state.tuesday}
              onChange={handleChange}
            />
          }
          label='T'
          labelPlacement='top'
        />
        <CompactFormControlLabel
          value='wednesday'
          control={
            <Checkbox
              name='wednesday'
              checked={state.wednesday}
              onChange={handleChange}
            />
          }
          label='W'
          labelPlacement='top'
        />
        <CompactFormControlLabel
          value='thursday'
          control={
            <Checkbox
              name='thursday'
              checked={state.thursday}
              onChange={handleChange}
            />
          }
          label='TH'
          labelPlacement='top'
        />
        <CompactFormControlLabel
          value='friday'
          control={
            <Checkbox
              name='friday'
              checked={state.friday}
              onChange={handleChange}
            />
          }
          label='F'
          labelPlacement='top'
        />
        <CompactFormControlLabel
          value='saturday'
          control={
            <Checkbox
              name='saturday'
              checked={state.saturday}
              onChange={handleChange}
            />
          }
          label='Sat'
          labelPlacement='top'
        />
      </CheckBoxWrapper>
      {willError && (
        <CustomHelperText error={!!errorValue}>{errorValue}</CustomHelperText>
      )}
    </Wrapper>
  );
};

CustomFormikWeekCheckbox.defaultProps = {
  // bla: 'test',
};
