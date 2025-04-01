/* eslint-disable no-unused-vars */
import { TextFieldProps } from '@material-ui/core';
import { AddBox, IndeterminateCheckBox } from '@material-ui/icons';
import React, { useEffect, useRef, useState } from 'react';
import { OutlinedInputProps } from '@material-ui/core';
import {
  HoverIconButton,
  IconWrapper,
  NoSpinInput,
  Wrapper,
} from './CustomNumberField.Styles';

type TCustomNumberField = Omit<TextFieldProps, 'ref'> & {
  min?: number;
  max?: number;
  onValueChange?: (value: number) => void;
  error?: boolean;
  helperText?: React.ReactNode;
  onBlur?: OutlinedInputProps['onBlur'];
  value?: number;
  isFloat?: boolean;
};

export const CustomNumberField: React.FunctionComponent<TCustomNumberField> = (
  props,
) => {
  const [value, setValue] = useState(0);
  const textFieldRef = useRef();

  const handleOnChange = (value: number) => {
    props.onValueChange && props.onValueChange(value);
    setValue(value);
  };

  useEffect(() => {
    setValue(props.value == null || props.value === NaN ? 0 : props.value);
  }, [props.value]);

  return (
    <Wrapper fullWidth={props.fullWidth}>
      <NoSpinInput
        // placeholder={props.label}
        inputRef={textFieldRef}
        {...props}
        type='number'
        variant='outlined'
        margin='dense'
        InputLabelProps={{
          shrink: true,
          ...props.InputLabelProps,
        }}
        error={props.error}
        onBlur={props.onBlur}
        InputProps={{
          notched: false,
          ...props.InputProps,
        }}
        value={value}
        onChange={(e) => {
          if (props.isFloat) handleOnChange(parseFloat(e.target.value));
          else handleOnChange(parseInt(e.target.value));
        }}
      />
      <IconWrapper>
        <HoverIconButton
          size='small'
          disableFocusRipple
          onClick={() => {
            if (props.min === undefined || value > props.min) {
              handleOnChange(value - 1);
            }
          }}
        >
          <IndeterminateCheckBox fontSize='medium' />
        </HoverIconButton>
        <HoverIconButton
          size='small'
          disableFocusRipple
          onClick={() => {
            if (props.max === undefined || value < props.max) {
              handleOnChange(value + 1);
            }
          }}
        >
          <AddBox fontSize='medium' />
        </HoverIconButton>
      </IconWrapper>
    </Wrapper>
  );
};
