import { IconButton, Tooltip } from '@material-ui/core';
import { GridOn } from '@material-ui/icons';
import React, { useEffect, useState } from 'react';
import { AccessRoles, READ_ONLY } from '../../../..';
import { CustomAutoCompleteField } from '../../../commons/CustomAutoCompleteField';
import { CustomFormikNumberField } from '../../../commons/CustomFormikNumberField';
import { DuoColumnSelector } from '../../../commons/DuoColumnSelector';
import { ICampaignGroup } from '../../../commons/types/campaignTypes';
import { IOption } from '../../../commons/types/commonTypes';
import { Groups } from '../Groups';
import {
  CheckBoxGroupWrapper,
  GroupWrapper,
  TextWrapper,
  Wrapper,
} from './GeneralForm.Styles';
import { ContactFlowInfo } from '../../../../types/connect-contact-flow';
import { ConnectQueueInfo } from '../../../../types/connect-queue';
import { ConnectPhoneNumberInfo } from '../../../../types/connect-phone-number';
import { PhoneNumberInfo } from 'lcme-common/lib/types/phone-numbers';

interface IGeneralForm {
  isSubmitting?: boolean;
  groups: any[];
  queues?: ConnectQueueInfo[];
  contactLists?: any;
  availableCallerIDs?: PhoneNumberInfo[] | undefined;
  contactFlows?: ContactFlowInfo[];
  contactList?: any;
  handleChange: any;
  formValues: any;
  accessLevel: any;
  getOneContactList: (contactListID: string) => any;
  onAddGroup: (group: ICampaignGroup) => void;
  onEditGroup: (group: ICampaignGroup, id: string, initialGroup: any) => void;
  onDeleteGroup: (id: string) => void;
  registerField: any;
  setCampaignMode: any;
}

export const GeneralForm: React.FunctionComponent<IGeneralForm> = ({
  groups,
  queues,
  contactLists,
  availableCallerIDs,
  contactFlows,
  contactList,
  formValues,
  accessLevel,
  getOneContactList,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  registerField,
  setCampaignMode,
}) => {
  const [phoneTypes, setPhoneTypes] = useState([] as string[]);
  const [pTValueStatus, setPTValueStatus] = useState(true);
  const [openGroup, setOpenGroup] = useState(false);
  const [mode, setMode] = useState('');
  const [modeOptions, setModeOptions] = useState([
    {
      label: 'Power',
      value: 'power',
    },
    {
      label: 'Agentless',
      value: 'agentless',
    },
  ]);

  useEffect(() => {
    setMode(formValues?.callingMode);
  }, [formValues?.callingMode]);

  useEffect(() => {
    if (contactList?.id === formValues.contactList) {
      setPhoneTypes(contactList.PhoneTypes);
    } else {
      setPhoneTypes([]);
    }
  }, [contactList]);

  useEffect(() => {
    if (formValues.contactList) {
      getOneContactList(formValues.contactList);
    } else {
      setPhoneTypes([]);
    }

    setPTValueStatus(false);
  }, [formValues.contactList]);

  return (
    <Wrapper>
      <TextWrapper>
        <GroupWrapper>
          <CustomAutoCompleteField
            options={groups.map((grp) => ({ label: grp.name, value: grp.id }))}
            name='group'
            label='Group'
            placeholder='Please Select'
            fullWidth
          />
          <Tooltip title='Manage Groups' placement='top'>
            <IconButton size='small' onClick={() => setOpenGroup(true)}>
              <GridOn />
            </IconButton>
          </Tooltip>
        </GroupWrapper>
        <TextWrapper>
          <CustomAutoCompleteField
            options={
              modeOptions.map(({ label, value }) => ({
                label: label,
                value: value,
              })) || []
            }
            name='callingMode'
            label='Calling Mode'
            placeholder='Please Select'
            onHandleChange={(value) => {
              setCampaignMode(value);
            }}
            fullWidth
          />
        </TextWrapper>
        <CustomAutoCompleteField
          options={
            queues?.map(({ Id, Name }) => ({
              label: `${Name} - ${Id}`,
              value: Id,
            })) || []
          }
          name='queue'
          label='Queue'
          placeholder='Please Select'
          disabledValues={[]}
          fullWidth
        />
        <CustomAutoCompleteField
          options={
            contactLists?.map(({ id, ContactListConfigName }) => ({
              label: `${ContactListConfigName}`,
              value: id,
            })) || []
          }
          name='contactList'
          label='Contact List'
          onHandleChange={(value) => {
            const contactList = value;
            if (contactList) {
              getOneContactList(contactList);
            } else {
              setPhoneTypes([]);
            }

            setPTValueStatus(true);
          }}
          placeholder='Please Select'
          fullWidth
        />
        <CustomAutoCompleteField
          options={
            availableCallerIDs?.map(({ friendlyName, callerID }) => ({
              label: `${friendlyName} (${callerID})`,
              value: callerID,
            })) || []
          }
          name='defaultCallerID'
          label='Default Caller ID'
          placeholder='Please Select'
          fullWidth
        />
        <CustomFormikNumberField
          name='weight'
          label='Campaign Priority'
          fullWidth
          min={1}
          max={100}
        />
        <CustomAutoCompleteField
          options={
            contactFlows?.map(({ Id, Name }) => ({
              label: `${Name} - ${Id}`,
              value: Id,
            })) || []
          }
          name='contactFlowOverride'
          label='Contact Flow Override'
          placeholder='Please Select'
          fullWidth
        />
      </TextWrapper>
      <CheckBoxGroupWrapper>
        <DuoColumnSelector
          name='activePhoneFields'
          label='Active Phone Fields'
          dependency={phoneTypes}
          itemOptions={phoneTypes}
          doValueChange={pTValueStatus}
        />
      </CheckBoxGroupWrapper>
      <Groups
        open={openGroup}
        isReadOnly={accessLevel === AccessRoles.READ_ONLY}
        onClose={() => setOpenGroup(false)}
        groups={groups}
        onAddGroup={(group: ICampaignGroup) => {
          onAddGroup(group);
        }}
        onEditGroup={(group: ICampaignGroup, id: string, initialGroup) => {
          onEditGroup(group, id, initialGroup);
        }}
        onDeleteGroup={(id: string) => onDeleteGroup(id)}
      />
    </Wrapper>
  );
};

GeneralForm.defaultProps = {
  isSubmitting: false,
};
