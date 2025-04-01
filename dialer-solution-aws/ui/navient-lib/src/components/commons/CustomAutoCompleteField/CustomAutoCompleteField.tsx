/* eslint-disable no-unused-vars */
import { TextFieldProps } from '@material-ui/core';
import { SyncDisabledTwoTone } from '@material-ui/icons';
import { AutocompleteRenderInputParams } from '@material-ui/lab/Autocomplete';
import { Field } from 'formik';
import { TextFieldProps as FormikTextFieldProps } from 'formik-material-ui';
import { Autocomplete } from 'formik-material-ui-lab';
import React from 'react';
import { IOption } from '../types/commonTypes';
import { LabeledInput, Wrapper } from './CustomAutoCompleteField.Styles';

type PCustomAutoCompleteField = TextFieldProps &
  FormikTextFieldProps & {
    options: IOption[];
    disabledValues?: string[];
    onHandleChange?: (data: string) => void;
    half?: boolean;
  };

export const CustomAutoCompleteField: React.FunctionComponent<
  PCustomAutoCompleteField
> = (props) => {
  const proptions = props.options || [];
  return (
    <Wrapper half={props.half}>
      <Field
        onChange={(event, data) => {
          props.form.setFieldValue(props.field.name as string, data);
          props.onHandleChange && props.onHandleChange(data);
        }}
        {...props}
        name={props.name}
        component={Autocomplete}
        options={proptions.map((o) => o.value)}
        getOptionLabel={(option: string) =>
          (proptions.find((o) => o.value === option) as IOption)?.label ||
          option
        }
        getOptionSelected={(option) => {
          return true;
        }}
        getOptionDisabled={(option) =>
          !!props.disabledValues?.find((value) => value === option)
        }
        onBlur={(e) => {
          const value = proptions.find((op) => op.label === e.target.value);

          if (value === undefined) {
            props.form.setFieldValue(props.field.name, '');
          }
        }}
        filterOptions={(options: string[]) => {
          if (!props.field.value?.length) return options;
          const validOptions: string[] = [];
          for (const { label, value } of proptions) {
            if (value === props.field?.value) {
              return options;
            }
            if (
              label
                .toLocaleLowerCase()
                .includes(props.field.value?.toLocaleLowerCase()) ||
              props.field.value === '' ||
              !props.field.value
            ) {
              validOptions.push(value);
            }
          }
          return validOptions;
        }}
        renderInput={(params: AutocompleteRenderInputParams) => (
          <LabeledInput
            placeholder={props.placeholder}
            field={props.field}
            form={props.form}
            meta={props.meta}
            {...params}
            label={props.label}
            variant='outlined'
            margin='dense'
            InputLabelProps={{
              ...params.InputLabelProps,
              shrink: true,
            }}
            InputProps={{
              ...params.InputProps,
              notched: false,
            }}
          />
        )}
      />
    </Wrapper>
  );
};

CustomAutoCompleteField.defaultProps = {};
