/* eslint-disable no-unused-vars */
import { Checkbox } from '@material-ui/core';
import { TextFieldProps } from 'formik-material-ui';
import React, { useState } from 'react';
import {
  CompactFormControlLabel,
  CustomHelperText,
  Wrapper,
} from './CustomFormikCheckboxComponent.Styles';

interface FieldProps {
  value: any;
  label: string;
}

type ICustomFormikCheckboxComponent = TextFieldProps & {
  fields: FieldProps[];
  row?: boolean;
};

export const CustomFormikCheckboxComponent: React.FunctionComponent<ICustomFormikCheckboxComponent> =
  ({ form, field }) => {
    const [state, setState] = useState({});

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const _state = { ...state, [event.target.name]: event.target.checked };
      setState(_state);
      const selectedTypes = Object.entries(_state)
        .filter((e) => e[1])
        .map((e) => e[0]);
      form.setFieldValue(field.name, selectedTypes);
    };

    const willError = form.touched[field.name] && !!form.errors[field.name];

    return (
      <Wrapper>
        {/* <CustomHelperText>{label}</CustomHelperText> */}
        {/* <CheckBoxWrapper> */}
        <CompactFormControlLabel
          value='home'
          control={<Checkbox name='home' onChange={handleChange} />}
          label='Home'
        />
        <CompactFormControlLabel
          value='cell'
          control={<Checkbox name='cell' onChange={handleChange} />}
          label='Cell'
        />
        <CompactFormControlLabel
          value='work'
          control={<Checkbox name='work' onChange={handleChange} />}
          label='Work'
        />
        <CompactFormControlLabel
          value='other'
          control={<Checkbox name='other' onChange={handleChange} />}
          label='Other'
        />
        {/* </CheckBoxWrapper> */}

        {willError && (
          <CustomHelperText error={willError}>
            {form.errors[field.name]}
          </CustomHelperText>
        )}
      </Wrapper>
    );
  };

CustomFormikCheckboxComponent.defaultProps = {
  // bla: 'test',
};
