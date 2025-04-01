import React, { useState } from 'react';
import { TextWrapper, Wrapper } from './ConfigurationForm.Styles';
import { CustomAutoCompleteField } from '../../commons/CustomAutoCompleteField';
import { CustomTextField } from '../../commons/CustomTextField';
import { IOption } from '../../commons/types/commonTypes';
import { MenuItem } from '@material-ui/core';

interface IConfigurationForm {
  values: any;
  setFieldValue: Function;
  touched: any;
  errors: any;
  contactLists: any;
  readOnly: boolean;
}

export const ConfigurationForm: React.FunctionComponent<IConfigurationForm> = ({
  contactLists,
  readOnly,
}) => {
  return (
    <Wrapper>
      <TextWrapper>
        <CustomAutoCompleteField
          disabled={readOnly}
          options={
            contactLists?.map(
              ({ id, ContactListConfigName, ContactListTable }) => ({
                label: `${ContactListConfigName}`,
                value: ContactListTable,
              }),
            ) || []
          }
          name='tableCL'
          label='Contact List'
          placeholder='Please Select'
          fullWidth
        />
        <CustomTextField
          disabled={readOnly}
          name='filterType'
          label='Filter Type'
          select
          fullWidth
        >
          <MenuItem value='none' disabled hidden>
            Please Select
          </MenuItem>
          <MenuItem value='contact'>Contact</MenuItem>
          <MenuItem value='phone'>Phone</MenuItem>
        </CustomTextField>
      </TextWrapper>
      <TextWrapper>
        <CustomTextField
          disabled={readOnly}
          name='filterOrSort'
          label='Filter or Sort'
          select
          fullWidth
        >
          <MenuItem value='none' disabled hidden>
            Please Select
          </MenuItem>
          <MenuItem value='filter'>Filter</MenuItem>
          <MenuItem value='sort'>Sort</MenuItem>
        </CustomTextField>
        {/* <CustomTextField
          name='sqlInput'
          label='Freeform or Builder'
          select
          fullWidth
        >
          <MenuItem value='none' disabled hidden>
            Please Select
          </MenuItem>
          <MenuItem value='freeform'>Freeform</MenuItem>
          <MenuItem value='builder'>Builder</MenuItem>
        </CustomTextField> */}
      </TextWrapper>
    </Wrapper>
  );
};

ConfigurationForm.defaultProps = {};
