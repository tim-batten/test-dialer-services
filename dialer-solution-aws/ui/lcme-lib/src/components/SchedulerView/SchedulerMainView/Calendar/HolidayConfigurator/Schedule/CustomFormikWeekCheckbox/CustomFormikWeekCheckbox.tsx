/* eslint-disable no-unused-vars */
import { Checkbox } from '@material-ui/core';
import { TextFieldProps } from 'formik-material-ui';
import React, { useState } from 'react';
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
export const CustomFormikWeekCheckbox: React.FunctionComponent<ICustomFormikWeekCheckbox> =
  ({ form, field, label }) => {
    const [state, setState] = useState({
      sunday: false,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
    });

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
            control={<Checkbox name='sunday' onChange={handleChange} />}
            label='S'
            labelPlacement='top'
          />
          <CompactFormControlLabel
            value='monday'
            control={<Checkbox name='monday' onChange={handleChange} />}
            label='M'
            labelPlacement='top'
          />
          <CompactFormControlLabel
            value='tuesday'
            control={<Checkbox name='tuesday' onChange={handleChange} />}
            label='T'
            labelPlacement='top'
          />
          <CompactFormControlLabel
            value='wednesday'
            control={<Checkbox name='wednesday' onChange={handleChange} />}
            label='W'
            labelPlacement='top'
          />
          <CompactFormControlLabel
            value='thursday'
            control={<Checkbox name='thursday' onChange={handleChange} />}
            label='TH'
            labelPlacement='top'
          />
          <CompactFormControlLabel
            value='friday'
            control={<Checkbox name='friday' onChange={handleChange} />}
            label='F'
            labelPlacement='top'
          />
          <CompactFormControlLabel
            value='saturday'
            control={<Checkbox name='saturday' onChange={handleChange} />}
            label='Sat'
            labelPlacement='top'
          />
        </CheckBoxWrapper>
        <CustomHelperText error={!!form.errors[field.name]}>
          {form.errors[field.name]}
        </CustomHelperText>
      </Wrapper>
    );
  };

CustomFormikWeekCheckbox.defaultProps = {
  // bla: 'test',
};
