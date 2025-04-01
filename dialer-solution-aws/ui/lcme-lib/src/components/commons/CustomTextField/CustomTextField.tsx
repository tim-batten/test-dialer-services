/* eslint-disable no-unused-vars */
import { TextFieldProps } from '@material-ui/core';
import { Field } from 'formik';
import React from 'react';
import { LabeledInput } from './CustomTextField.Styles';

export const CustomTextField: React.FunctionComponent<TextFieldProps> = (
  props,
) => {
  return (
    <Field
      {...props}
      component={LabeledInput}
      variant='outlined'
      margin='dense'
      InputLabelProps={{
        shrink: true,
      }}
      InputProps={{
        notched: false,
      }}
    />
  );
};

CustomTextField.defaultProps = {
  type: 'text',
};
