import {
  Button,
  Step,
  StepContent,
  StepLabel,
  Stepper,
} from '@material-ui/core';
import { Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import {
  get_config_account,
  isBaseURLAll,
  set_base_configURL,
} from '../../api';
import { AccessRoles } from '../../constants/AccessLevel';
import { AccountSelector } from '../commons/AccountSelector';
import { SnackbarComponent } from '../commons/SnackbarComponent';
import {
  ConfigFormValues,
  configFormInitialValues,
} from '../commons/assets/InitialValues';
import { IAccounts, IOption } from '../commons/types/commonTypes';
import {
  IConnect,
  IDialerDefaults,
  IGlobalConfig,
} from '../commons/types/globalTypes';
import { configValidationSchema } from '../commons/validation/ConfigValidation';
import {
  ButtonWrapper,
  ButtonWrapper2,
  ContentWrapper,
  FormContainer,
  FormLayout,
  FormWrapper,
  Title,
  TitleWrapper,
  Wrapper,
} from './Config.Styles';
import { ConnectForm } from './ConnectForm';
import { DialerDefaultsForm } from './DialerDefaultsForm';
import { ContactFlowInfo } from '../../types/connect-contact-flow';
import { max } from 'lodash';

interface IConfig {
  title?: string;
  onDiscardClick?: Function;
  connectConfig?: any;
  dialerDefaultsConfig?: any;
  dialerDefaults?: any;
  contactFlows?: ContactFlowInfo[];
  initialGlobalConfig: IGlobalConfig;
  accessLevel: any;
  selectedAccount: IAccounts | undefined | 'All';
  setAccount: (account: IAccounts | undefined | 'All') => void;
  getContactFlowList: () => void;
  getDialerDefaults: () => void;
  getGlobalConfig: () => void;
  getAWSRegions: () => void;
  updateGlobal: (
    global: any,
    callback: (info: any) => void,
    initialGlobalConfig: IGlobalConfig,
  ) => void;
  awsRegions: string[];
}

export const ConfigMainView: React.FunctionComponent<IConfig> = ({
  getDialerDefaults,
  getGlobalConfig,
  getAWSRegions,
  updateGlobal,
  contactFlows,
  accessLevel,
  connectConfig,
  dialerDefaultsConfig,
  initialGlobalConfig,
  dialerDefaults,
  getContactFlowList,
  selectedAccount,
  setAccount,
  awsRegions,
}) => {
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error'>('success');

  const [step] = useState(0);
  const [openStepOne, setOpenStepOne] = useState(true);
  const [openStepTwo, setOpenStepTwo] = useState(true);

  const handleSubmit = (submitForm: Function) => {
    submitForm();
  };

  const handleClose = () => {
    setOpenSnack(false);
  };

  const handleUpdateCallback = (data: any, type: string) => {
    const status = data.action.type;

    if (
      status === 'UPDATE_GLOBAL_CONFIG_FULFILLED' ||
      status === 'UPDATE_TWILIO_AUTH_FULFILLED'
    ) {
      setSnackMessage(`${type} Updated!`);
      setSeverity('success');
    } else if (data.errorMessage && data.errorMessage.includes('409')) {
      setSnackMessage('Data state is stale; refresh & retry!');
      setSeverity('error');
    } else {
      setSnackMessage('Update Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  useEffect(() => {
    if (isBaseURLAll()) {
      setAccount(get_config_account());
      set_base_configURL();
    }
    getAWSRegions();
  }, []);

  useEffect(() => {
    getGlobalConfig();
    getDialerDefaults();
    getContactFlowList();
  }, [selectedAccount]);

  // useEffect(() => {
  //   //TODO
  // }, [selectedAccount]);

  const onSend = (values) => {
    const globalSubmit = {
      Connect: {
        AwsRegion: values.awsRegion,
        InstanceArn: values.instanceArn,
        ConnectProjectCPS: values.connectProjectCPS,
      },
      DialerDefaults: {
        ScheduleTimezone: values.scheduleTimezone,
        ContactFlowId: values.contactFlowId,
        InitialCpaMin: values.initialCpa[0],
        InitialCpaMax: values.initialCpa[1],
        MaxCPA: values.maxCpa,
        InitialPacingDurationMin: values.initialPacingDurationMin,
        InitialPacingDurationMax: values.initialPacingDurationMax,
        InitialPacingSamplesMin: values.initialPacingSamplesMin,
        InitialPacingSamplesMax: values.initialPacingSamplesMax,
        AbandonmentIncrementMin: values.abandonmentIncrementMin,
        AbandonmentIncrementMax: values.abandonmentIncrementMax,
        CpaModifierMin: values.cpaModifierMin,
        CpaModifierMax: values.cpaModifierMax,
        AbaTargetRateMin: values.abaTargetRateMin,
        AbaTargetRateMax: values.abaTargetRateMax,
        CallLimitRecordMin: values.callLimitRecord[0],
        CallLimitRecordMax: values.callLimitRecord[1],
        CallLimitPhoneMin: values.callLimitPhone[0],
        CallLimitPhoneMax: values.callLimitPhone[1],
        ScheduleLoopsMin: values.scheduleLoops[0],
        ScheduleLoopsMax: values.scheduleLoops[1],
        ConcurrentCallsMin: values.concurrentCallsMin,
        ConcurrentCallsMax: values.concurrentCallsMax,
        MaxRingTime: values.maxRingTime,
      },
    };

    updateGlobal(
      globalSubmit,
      (data) => {
        handleUpdateCallback(data, 'Global Configuration');
      },
      initialGlobalConfig,
    );
  };

  const setFormValues = (
    setValues: (values: React.SetStateAction<ConfigFormValues>) => void,
  ) => {
    const connectValues: IConnect = connectConfig;
    const dialerDefaultsValues: IDialerDefaults = dialerDefaultsConfig;

    if (
      connectValues &&
      dialerDefaultsValues &&
      Object.keys(connectValues).length &&
      Object.keys(dialerDefaultsValues).length
    ) {
      const template = {
        awsRegion: connectValues.AwsRegion,
        instanceArn: connectValues.InstanceArn,
        connectProjectCPS: connectValues.ConnectProjectCPS,
        scheduleTimezone: dialerDefaultsValues.ScheduleTimezone,
        contactFlowId: dialerDefaultsValues.ContactFlowId,
        abandonmentIncrementMin: dialerDefaultsValues.AbandonmentIncrementMin,
        abandonmentIncrementMax: dialerDefaultsValues.AbandonmentIncrementMax,
        cpaModifierMin: dialerDefaultsValues.CpaModifierMin,
        cpaModifierMax: dialerDefaultsValues.CpaModifierMax,
        abaTargetRateMin: dialerDefaultsValues.AbaTargetRateMin,
        abaTargetRateMax: dialerDefaultsValues.AbaTargetRateMax,
        concurrentCallsMin: dialerDefaultsValues.ConcurrentCallsMin,
        concurrentCallsMax: dialerDefaultsValues.ConcurrentCallsMax,
        maxRingTime: dialerDefaultsValues.MaxRingTime,
        initialPacingDurationMin: dialerDefaultsValues.InitialPacingDurationMin,
        initialPacingDurationMax: dialerDefaultsValues.InitialPacingDurationMax,
        initialPacingSamplesMin: dialerDefaultsValues.InitialPacingSamplesMin,
        initialPacingSamplesMax: dialerDefaultsValues.InitialPacingSamplesMax,
        maxCpa: dialerDefaultsValues.MaxCPA,
        initialCpa: [
          dialerDefaultsValues.InitialCpaMin,
          dialerDefaultsValues.InitialCpaMax,
        ],
        scheduleLoops: [
          dialerDefaultsValues.ScheduleLoopsMin,
          dialerDefaultsValues.ScheduleLoopsMax,
        ],
        callLimitRecord: [
          dialerDefaultsValues.CallLimitRecordMin,
          dialerDefaultsValues.CallLimitRecordMax,
        ],
        callLimitPhone: [
          dialerDefaultsValues.CallLimitPhoneMin,
          dialerDefaultsValues.CallLimitPhoneMax,
        ],
      };

      setValues(template);
    }
  };
  const disabled = accessLevel !== AccessRoles.ADMINISTRATOR;

  return (
    <Wrapper>
      <TitleWrapper>
        <Title variant='h6' gutterBottom>
          {`Global Configuration${
            disabled ? ` (Read Only for ${accessLevel.toUpperCase()})` : ''
          }`}
        </Title>{' '}
        <ButtonWrapper2>
          <AccountSelector
            initialValue={selectedAccount}
            onValueChange={(data) => setAccount(data)}
            noAll
          />
        </ButtonWrapper2>
      </TitleWrapper>
      <FormWrapper>
        <FormLayout>
          <FormContainer>
            <Formik
              initialValues={configFormInitialValues}
              validationSchema={configValidationSchema}
              onSubmit={(values, { setSubmitting }) => {
                onSend(values);
                setSubmitting(false);
              }}
            >
              {({ submitForm, values, errors, setValues }) => (
                <Form>
                  {useEffect(() => {
                    setTimeout(() => {
                      setFormValues(setValues);
                    }, 400);
                  }, [connectConfig, dialerDefaultsConfig])}
                  <Stepper activeStep={step} orientation='vertical'>
                    <Step active={openStepOne}>
                      <StepLabel
                        onClick={() => {
                          setOpenStepOne(!openStepOne);
                        }}
                      >
                        Connect
                      </StepLabel>
                      <StepContent>
                        <ContentWrapper disable={disabled}>
                          <ConnectForm
                            awsRegion={values?.awsRegion}
                            awsRegions={awsRegions}
                          >
                            Connect
                          </ConnectForm>
                        </ContentWrapper>
                      </StepContent>
                    </Step>
                    <Step active={openStepTwo}>
                      <StepLabel
                        onClick={() => {
                          setOpenStepTwo(!openStepTwo);
                        }}
                      >
                        Dialer Defaults
                      </StepLabel>
                      <StepContent>
                        <ContentWrapper disable={disabled}>
                          <DialerDefaultsForm
                            contactFlows={contactFlows || []}
                            formValues={values}
                            errors={errors}
                          />
                        </ContentWrapper>
                      </StepContent>
                    </Step>
                    <Step expanded>
                      <StepContent>
                        <ButtonWrapper>
                          <Button
                            variant='contained'
                            color='primary'
                            onClick={() => handleSubmit(submitForm)}
                            disabled={disabled}
                          >
                            {disabled
                              ? 'Read Only - Save Disabled'
                              : 'Save Changes'}
                          </Button>
                        </ButtonWrapper>
                      </StepContent>
                    </Step>
                  </Stepper>
                  <SnackbarComponent
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'center',
                    }}
                    open={openSnack}
                    autoHideDuration={6000}
                    onAlertClose={handleClose}
                    alertMessage={snackMessage}
                    severity={severity}
                  />
                </Form>
              )}
            </Formik>
          </FormContainer>
        </FormLayout>
      </FormWrapper>
    </Wrapper>
  );
};

ConfigMainView.defaultProps = {};
