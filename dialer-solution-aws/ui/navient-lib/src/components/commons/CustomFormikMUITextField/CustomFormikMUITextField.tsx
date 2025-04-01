/* eslint-disable no-unused-vars */
import { TextField } from '@material-ui/core';
import { fieldToTextField, TextFieldProps } from 'formik-material-ui';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';

const customFormikMUITextField = (props: TextFieldProps, ref: any) => {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    updateValue: (value: any) => {
      props.form.setFieldTouched(props.field.name, true);
      props.form.setFieldValue(props.field.name, value);
    },
    value: (inputRef.current as any).value,
  }));
  return <TextField inputRef={inputRef} {...fieldToTextField(props)} />;
};

export const CustomFormikMUITextField = forwardRef(customFormikMUITextField);
