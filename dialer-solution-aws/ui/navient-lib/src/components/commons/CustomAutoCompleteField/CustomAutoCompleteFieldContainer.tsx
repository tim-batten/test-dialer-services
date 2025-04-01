/* eslint-disable no-unused-vars */
import { TextFieldProps } from '@material-ui/core';
import { Field } from 'formik';
import React from 'react';
import { IOption } from '../types/commonTypes';
import { CustomAutoCompleteField } from './CustomAutoCompleteField';

type TCustomAutoCompleteFieldContainer = TextFieldProps & {
  options: IOption[];
  disabledValues?: string[];
  name: string;
  label: string;
  onHandleChange?: (data: string) => void;
  half?: boolean;
};

export const CustomAutoCompleteFieldContainer: React.FunctionComponent<
  TCustomAutoCompleteFieldContainer
> = (props) => {
  return (
    <Field
      component={CustomAutoCompleteField}
      onHandleChange={(data) => {
        props.onHandleChange && props.onHandleChange(data);
      }}
      half={props.half}
      options={props.options}
      disabledValues={props.disabledValues && props.disabledValues}
      name={props.name}
      label={props.label}
      placeholder={props.placeholder}
      disabled={props.disabled}
    />
  );
};

CustomAutoCompleteFieldContainer.defaultProps = {
  // bla: 'test',
};
