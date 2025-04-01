import {
  Button,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@material-ui/core';
import Divider from '@material-ui/core/Divider';
import { Field, Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { AccessRoles, READ_ONLY } from '../../..';
import {
  campaignFormInitialValues,
  ICampaignsClass,
} from '../../commons/assets/InitialValues';
import { EditableTextField } from '../../commons/EditableTextField';
import { SubName } from '../../commons/style/MUI.Styles';
import { CallingMode, ICampaign, ICampaignGroup } from '../../commons/types/campaignTypes';
import { campaignFormValidationSchema } from '../../commons/validation/CampaignValidation';
import {
  ButtonWrapper,
  ConfigWrapper,
  FormWrapper,
  Title,
  Wrapper,
} from './CampaignConfigurator.Styles';
import { CustomAttributes } from './CustomAttributes';
import { GeneralForm } from './GeneralForm';
import { PacingForm } from './PacingForm';
import { TSeverity } from '../../commons/types/commonTypes';
import { AccountSelector } from '../../commons/AccountSelector';
import { accounts } from '../../../frontend-config';
import { ContactFlowInfo } from '../../../types/connect-contact-flow';
import { ConnectQueueInfo } from '../../../types/connect-queue';

import {
  config_baseURL,
  set_config_baseURL,
  baseURL,
} from '../../../api/utils';
import { ConnectPhoneNumberInfo } from '../../../types/connect-phone-number';
import { IDialerDefaults } from '../../commons/types/globalTypes';
import { PhoneNumberInfo } from 'navient-common/lib/types/phone-numbers';

interface ICampaignConfigurator {
  campaigns: ICampaign[];
  title?: string;
  onDiscardClick: Function;
  creating?: Boolean;
  copied?: Boolean;
  groups: any[];
  queues?: ConnectQueueInfo[];
  contactLists?: any;
  availableCallerIDs?: PhoneNumberInfo[];
  contactFlows?: ContactFlowInfo[];
  contactList?: any;
  dialerDefaults: IDialerDefaults;
  accessLevel: any;
  selectedRow: any;
  readOnly: boolean;
  updateCampaignByID: (
    editedCampaignConfig: ICampaign,
    id: string,
    initialCampaignConfig,
  ) => void;
  addCampaign: (campaign: ICampaign) => void;
  getOneContactList: (contactListID: string) => any;
  handleOpenSnack: () => void;
  onAddGroup: (group: ICampaignGroup) => void;
  onEditGroup: (group: ICampaignGroup, id: string, initialGroup: any) => void;
  onDeleteGroup: (id: string) => void;
  onAlert: (message: string, severity: TSeverity) => void;
  onAccountChange: (url: string) => any;
}

export const CampaignConfigurator: React.FunctionComponent<
  ICampaignConfigurator
> = ({
  onDiscardClick,
  campaigns,
  creating,
  copied,
  groups,
  queues,
  contactLists,
  availableCallerIDs,
  contactFlows,
  contactList,
  getOneContactList,
  dialerDefaults,
  accessLevel,
  selectedRow,
  readOnly,
  updateCampaignByID,
  addCampaign,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  onAlert,
  onAccountChange,
}) => {
  const [step] = useState(0);
  const [openStepOne, setOpenStepOne] = useState(true);
  const [openStepTwo, setOpenStepTwo] = useState(true);
  const [openStepThree, setOpenStepThree] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(selectedRow);
  const [configAccount, setConfigAccount] = useState<any>();
  const [campaignMode, setCampaignMode] = useState('');

  const handleDiscard = (resetForm: Function) => {
    resetForm();
    onDiscardClick();
    setSelectedCampaign(null);
  };

  const handleSubmit = (submitForm: Function) => {
    submitForm();
  };

  useEffect(() => {
    setSelectedCampaign(JSON.parse(JSON.stringify(selectedRow)));

    if (selectedRow && selectedRow.prjacc) {
      setConfigAccount(accounts.find((a) => a.url === selectedRow.prjacc.url));
      set_config_baseURL(selectedRow.prjacc.url);
      onAccountChange(selectedRow.prjacc.url);
    } else if (selectedRow && JSON.stringify(selectedRow) !== '{}') {
      setConfigAccount(accounts.find((a) => a.url === baseURL()));
      onAccountChange(baseURL());
      set_config_baseURL(baseURL());
    } else {
      setConfigAccount(accounts.find((a) => a.url === config_baseURL()));
      onAccountChange(config_baseURL());
    }
  }, [selectedRow]);

  const setFormValues = (setValues) => {
    const campaign: ICampaign = selectedCampaign;

    if (campaign && Object.keys(campaign).length > 0) {
      if (campaign.BaseConfig.CallingMode === 'agentless') {
        setCampaignMode('agentless');
      }
      if (campaign.BaseConfig.CallingMode === 'power') {
        setCampaignMode('power');
      }
      const template: ICampaignsClass = {
        campaignConfigName: campaign.CampaignName,
        callingMode: campaign.BaseConfig.CallingMode,
        group: campaign.BaseConfig.CampaignGroupId,
        queue: campaign.BaseConfig.Queue,
        contactList: campaign.BaseConfig.ContactListConfigID,
        defaultCallerID: campaign.BaseConfig.Callerid,
        weight: campaign.BaseConfig.Weight,
        activePhoneFields: campaign.BaseConfig.ActivePhoneTypes,
        contactFlowOverride: campaign.BaseConfig.ContactFlowOverride || '',
        initialCallsPerAgent: campaign.Pacing.InitialCPA,
        maxPerAgent: campaign.Pacing.MaxCPA || dialerDefaults?.MaxCPA || 0,
        initialCpaMode: campaign.Pacing.InitialCPAMode,
        initialPacing: campaign.Pacing.InitialDuration,
        aBAIncrement: campaign.Pacing.AbaIncrement,
        cPAModifier: campaign.Pacing.CpaModifier,
        aBACalculation: campaign.Pacing.AbaCalculation,
        aBATargetRate: campaign.Pacing.AbaTargetRate,
        concurrentCalls: campaign.Pacing.ConcurrentCalls || 0,
        customAttributes: campaign?.CustomAttributes?.ActiveAttributes?.map(
          (c) => ({
            name: c.Name,
            value: c.Value,
          }),
        ),
      };

      setValues(template);
    }
  };

  const onSend = (value: ICampaignsClass, resetForm) => {
    const campaign: ICampaign = {
      CampaignName: value.campaignConfigName,
      BaseConfig: {
        CallingMode: value.callingMode as CallingMode,
        CampaignGroupId: value.group,
        Queue: value.queue,
        ContactListConfigID: value.contactList,
        Callerid: value.defaultCallerID,
        ContactFlowOverride: value.contactFlowOverride,
        Weight: value.weight,
        ActivePhoneTypes: value.activePhoneFields,
      },
      Pacing: {
        // InitialCPAMode: value.initialCpaMode,
        InitialCPA: value.initialCallsPerAgent,
        MaxCPA: null,
        InitialDuration: value.initialPacing,
        AbaIncrement: value.aBAIncrement,
        CpaModifier: value.cPAModifier,
        // AbaCalculation: value.aBACalculation,
        AbaTargetRate: value.aBATargetRate,
        ConcurrentCalls: value.concurrentCalls,
      },
      CustomAttributes: {
        ActiveAttributes: value.customAttributes.map((c) => ({
          Name: c.name,
          Value: c.value,
        })),
      },
    };

    if (value.callingMode === 'power') {
      campaign.Pacing = {
        InitialCPAMode: value.initialCpaMode,
        InitialCPA: value.initialCallsPerAgent,
        MaxCPA: value.maxPerAgent,
        InitialDuration: value.initialPacing,
        AbaIncrement: value.aBAIncrement,
        CpaModifier: value.cPAModifier,
        AbaCalculation: value.aBACalculation,
        AbaTargetRate: value.aBATargetRate,
      };
    }

    if (!creating && !copied) {
      updateCampaignByID(campaign, selectedRow.id, selectedRow);
    } else {
      addCampaign(campaign);
    }

    handleDiscard(resetForm);
  };

  const checkCampaignName = (formValues) => {
    let lowerCheck = formValues.campaignConfigName.toLowerCase();
    let campaignCheck = campaigns.filter((camp) => {
      return camp.CampaignName.toLowerCase() === lowerCheck;
    });
    return (
      campaignCheck.length === 0 ||
      (campaignCheck.length > 0 &&
        !creating &&
        formValues.campaignConfigName === selectedCampaign?.CampaignName)
    );
  };

  return (
    <Wrapper>
      <FormWrapper>
        <Formik
          initialValues={campaignFormInitialValues(dialerDefaults)}
          validationSchema={campaignFormValidationSchema(dialerDefaults)}
          onSubmit={(values: ICampaignsClass, { setSubmitting, resetForm }) => {
            if (checkCampaignName(values)) {
              onSend(values, resetForm);
            } else {
              onAlert(
                'This Campaign Name is already in use please use a new one',
                'warning',
              );
            }
            setSubmitting(false);
          }}
        >
          {({
            submitForm,
            isSubmitting,
            resetForm,
            setValues,
            setFieldTouched,
            setFieldValue,
            handleChange,
            values,
            errors,
            registerField,
          }) => (
            <Form>
              {useEffect(() => {
                setTimeout(() => {
                  setFormValues(setValues);
                }, 400);
              }, [selectedCampaign])}
              <Title variant='h5' gutterBottom>
                <Field
                  name='campaignConfigName'
                  label='Campaign Name'
                  component={EditableTextField}
                />
                <SubName variant='body2'>
                  {selectedCampaign && selectedCampaign.id}
                </SubName>
              </Title>
              <Divider />
              <ConfigWrapper>
                <AccountSelector
                  initialValue={configAccount}
                  onValueChange={(account) => {
                    if (account && account !== 'All') {
                      setConfigAccount(account);
                      onAccountChange(account.url);
                      set_config_baseURL(account.url);
                    }
                  }}
                  fullWidth
                  noAll
                  disabled={!creating}
                />
              </ConfigWrapper>
              <Divider />
              <Stepper activeStep={step} orientation='vertical'>
                <Step active={openStepOne}>
                  <StepLabel
                    onClick={() => {
                      setOpenStepOne(!openStepOne);
                    }}
                  >
                    General
                  </StepLabel>
                  <StepContent>
                    <GeneralForm
                      accessLevel={accessLevel}
                      groups={groups}
                      queues={queues}
                      contactLists={contactLists}
                      availableCallerIDs={availableCallerIDs}
                      contactFlows={contactFlows}
                      contactList={contactList}
                      getOneContactList={getOneContactList}
                      handleChange={handleChange}
                      formValues={values}
                      setCampaignMode={setCampaignMode}
                      registerField={registerField}
                      onAddGroup={(group: ICampaignGroup) => {
                        onAddGroup(group);
                      }}
                      onEditGroup={(
                        group: ICampaignGroup,
                        id: string,
                        initialGroup,
                      ) => {
                        onEditGroup(group, id, initialGroup);
                      }}
                      onDeleteGroup={(id: string) => onDeleteGroup(id)}
                    />
                  </StepContent>
                </Step>
                <Step active={openStepTwo}>
                  <StepLabel
                    onClick={() => {
                      setOpenStepTwo(!openStepTwo);
                    }}
                  >
                    Pacing
                  </StepLabel>
                  <StepContent>
                    <PacingForm
                      isCampaignConfig={true}
                      formValues={values}
                      campaignMode={campaignMode}
                      errors={errors}
                    />
                  </StepContent>
                </Step>
                <Step active={openStepThree}>
                  <StepLabel
                    onClick={() => {
                      setOpenStepThree(!openStepThree);
                    }}
                  >
                    Custom Attributes
                  </StepLabel>
                  <StepContent>
                    <CustomAttributes />
                  </StepContent>
                </Step>
                <Step expanded>
                  <StepContent>
                    <ButtonWrapper>
                      <Button
                        variant='contained'
                        color='primary'
                        disabled={isSubmitting || readOnly}
                        onClick={() => handleSubmit(submitForm)}
                      >
                        {creating === true ? 'Create' : 'Update'}
                      </Button>
                      <Button
                        variant='contained'
                        color='primary'
                        onClick={() => handleDiscard(resetForm)}
                      >
                        {readOnly ? 'Close' : 'Discard'}
                      </Button>
                    </ButtonWrapper>
                  </StepContent>
                </Step>
              </Stepper>
            </Form>
          )}
        </Formik>
      </FormWrapper>
    </Wrapper>
  );
};

CampaignConfigurator.defaultProps = {
  title: 'Campaign Name',
};
