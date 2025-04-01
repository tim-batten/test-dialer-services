/* eslint-disable no-unused-vars */
import { TextFieldProps } from '@material-ui/core';
import { AddBox, Clear, IndeterminateCheckBox } from '@material-ui/icons';
import { Field } from 'formik';
import React, { useRef } from 'react';
import {
  HoverIconButton,
  IconWrapper,
  NoSpinInput,
  Wrapper,
} from './CustomFormikNumberField.Styles';

type TCustomFormikNumberField = TextFieldProps & {
  min?: number;
  max?: number;
  half?: boolean;
  clear?: boolean;
};

export const CustomFormikNumberField: React.FunctionComponent<
  TCustomFormikNumberField
> = (props) => {
  const inputFieldRef = useRef(null);
  const clear = props.clear && (props.value + '').length > 0;
  return (
    <Wrapper fullWidth={props.fullWidth} half={props.half}>
      <Field
        placeholder={props.label}
        {...props}
        component={NoSpinInput}
        clear={clear}
        type='number'
        variant='outlined'
        margin='dense'
        innerRef={inputFieldRef}
        InputLabelProps={{
          shrink: true,
          ...props.InputLabelProps,
        }}
        InputProps={{
          notched: false,
          ...props.InputProps,
        }}
      />
      <IconWrapper>
        {clear && (
          <HoverIconButton
            size='small'
            disableFocusRipple
            onClick={() => {
              (inputFieldRef.current as any).updateValue('');
            }}
          >
            <Clear fontSize='medium' />
          </HoverIconButton>
        )}
        <HoverIconButton
          size='small'
          disableFocusRipple
          onClick={() => {
            var value = parseInt((inputFieldRef.current as any).value || 0);
            if (props.min === undefined || value > props.min) {
              (inputFieldRef.current as any).updateValue(--value);
            }
          }}
        >
          <IndeterminateCheckBox fontSize='medium' />
        </HoverIconButton>
        <HoverIconButton
          size='small'
          disableFocusRipple
          onClick={() => {
            var value = parseInt((inputFieldRef.current as any).value || 0);
            if (props.max === undefined || value < props.max) {
              (inputFieldRef.current as any).updateValue(++value);
            }
          }}
        >
          <AddBox fontSize='medium' />
        </HoverIconButton>
      </IconWrapper>
    </Wrapper>
  );
};
