/* eslint-disable no-unused-vars */
import { IconButton } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import { TextFieldProps } from 'formik-material-ui';
import React, { useEffect } from 'react';
import { CustomHelperText, Wrapper } from './EditableTextField.Styles';

interface IEditButtons {
  onEditClick: () => void;
}

const EditButton: React.FunctionComponent<IEditButtons> = ({ onEditClick }) => {
  return (
    <div style={{ cursor: 'pointer', display: 'inline' }}>
      <IconButton
        onClick={() => {
          onEditClick();
        }}
      >
        <EditOutlinedIcon style={{ fontSize: '.7em' }} />
      </IconButton>
    </div>
  );
};

type IEditableTextField = TextFieldProps & {
  row?: boolean;
};

export const EditableTextField: React.FunctionComponent<IEditableTextField> = ({
  form,
  field,
  label,
}) => {
  const [isTextFocused, setIsTextFocused] = React.useState(false);
  const [validationError, setValidationError] = React.useState(
    form.errors[field.name],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    form.setFieldValue(field.name, event.target.value);
  };

  const willError = form.touched[field.name] && !!form.errors[field.name];

  return (
    <Wrapper>
      {!isTextFocused ? (
        <div>
          <div
            style={{
              display: 'inline',
              color: !willError ? 'inherit' : 'red',
            }}
          >
            {field.value}
          </div>
          <EditButton
            onEditClick={() => {
              setIsTextFocused(true);
            }}
          />
        </div>
      ) : (
        <TextField
          style={{ width: 300 }}
          autoFocus
          label={label}
          value={field.value}
          onChange={handleChange}
          onBlur={() => {
            setIsTextFocused(false);
            form.setFieldTouched(field.name, true);
          }}
        />
      )}
      {willError && (
        <CustomHelperText error={willError}>
          {form.errors[field.name]}
        </CustomHelperText>
      )}
    </Wrapper>
  );
};

EditableTextField.defaultProps = {
  type: 'text',
};
