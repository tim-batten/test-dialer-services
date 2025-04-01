/* eslint-disable no-unused-vars */
import { OutlinedInputProps } from '@material-ui/core';
import React from 'react';
import { LabeledInput, Wrapper } from './TopLabeledTextField.Styles';

interface ITopLabeledTextField {
  name?: string;
  label: string;
  placeholder?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  fullWidth?: boolean;
  half?: boolean;
  select?: boolean;
  value?: unknown;
  error?: boolean;
  helperText?: React.ReactNode;
  onBlur?: OutlinedInputProps['onBlur'];
  width?: number;
}

export const TopLabeledTextField: React.FunctionComponent<
  ITopLabeledTextField
> = (props) => {
  return (
    <Wrapper half={props.half}>
      <LabeledInput
        {...props}
        style={props.width ? { width: props.width } : {}}
        placeholder={props.placeholder || props.label}
        onChange={(e) => props.onChange && props.onChange(e)}
        variant='outlined'
        margin='dense'
        InputLabelProps={{
          shrink: true,
        }}
        InputProps={{
          notched: false,
        }}
      />
    </Wrapper>
  );
};

TopLabeledTextField.defaultProps = {
  // bla: 'test',
};
