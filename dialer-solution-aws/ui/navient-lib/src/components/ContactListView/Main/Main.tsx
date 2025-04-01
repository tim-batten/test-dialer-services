import React, { useState, useEffect } from 'react';
import { CustomTextField } from '../../commons/CustomTextField';
import { TextWrapper, Wrapper } from './Main.Styles';
import { Divider } from '@material-ui/core';
import { DuoColumnSelector } from '../../commons/DuoColumnSelector';

interface IMain {
  formValues: any;
  creating?: Boolean;
}

export const MainForm: React.FunctionComponent<IMain> = ({
  formValues,
  creating,
}) => {
  // const [phoneTypes, setPhoneTypes] = useState([
  //   'Home',
  //   'Cell',
  //   'Work',
  //   'Other',
  // ] as string[]);
  // const [pTValueStatus, setPTValueStatus] = useState(false);

  // useEffect(() => {
  //   setPhoneTypes;
  //   // if (!creating) setPhoneTypes(formValues.PhoneTypes);
  //   // else setPhoneTypes(['Home', 'Cell', 'Work', 'Other']);
  // }, [formValues.PhoneTypes]);

  return (
    <Wrapper>
      <TextWrapper>
        <CustomTextField name='contactListTable' label='Contact List Table' />
        <CustomTextField name='phoneListTable' label='Phone List Table' />
        <CustomTextField name='doNotCallTable' label='DNC Table' />
        <CustomTextField
          name='dncUniqueRecordIdentifier'
          label='DNC Unique Record Identifier'
        />
        <CustomTextField name='phoneTypes' label='Phone Types' />

        {/* The code below will replace the code above once we are getting real Navient data in to populate the fields rather than using freeform text fields */}

        {/* <CustomAutoCompleteField
          options={[
            { label: 'CL_Test1', value: 'CL_Test1' },
            { label: 'CL_Test2', value: 'CL_Test2' },
          ]}
          name='contactListTable'
          label='Contact List Table'
          placeholder='Please Select'
          fullWidth
        />
        <CustomAutoCompleteField
          options={[
            { label: 'PND_Test1', value: 'PND_Test1' },
            { label: 'PND_Test2', value: 'PND_Test2' },
          ]}
          name='phoneListTable'
          label='Phone List Table'
          placeholder='Please Select'
          fullWidth
        />
        <CustomAutoCompleteField
          options={[
            { label: 'CL_Test1', value: 'CL_Test1' },
            { label: 'CL_Test2', value: 'CL_Test2' },
          ]}
          name='doNotCallTable'
          label='Do Not Call Table'
          placeholder='Please Select'
          fullWidth
        />
        <CustomAutoCompleteField
          options={[
            { label: 'CL_Test1', value: 'CL_Test1' },
            { label: 'CL_Test2', value: 'CL_Test2' },
          ]}
          name='dncUniqueRecordIdentifier'
          label='DNC Unique Record Identifier'
          placeholder='Please Select'
          fullWidth
        /> */}
        {/* <Divider />
        <DuoColumnSelector
          name='phoneTypes'
          label='Phone Types'
          // values={['hello', 'world']}
          itemOptions={phoneTypes}
          // doValueChange={pTValueStatus}
        /> */}
      </TextWrapper>
    </Wrapper>
  );
};

MainForm.defaultProps = {};
