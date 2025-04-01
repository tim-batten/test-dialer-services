/* eslint-disable no-empty-pattern */
import {
  Button,
  createTheme,
  Divider,
  MuiThemeProvider,
  Tooltip,
} from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { Close, Save } from '@material-ui/icons';
import { Form, Formik } from 'formik';
import PubSub from 'pubsub-js';
import React, { useEffect, useState } from 'react';
import { baseURL, config_baseURL, set_config_baseURL } from '../../../../api';
import { accounts } from '../../../../frontend-config';
import { PacingForm } from '../../../CampaignView/CampaignConfigurator/PacingForm';
import { AccountSelector } from '../../../commons/AccountSelector';
import { campaignOversightFormInitialValues } from '../../../commons/assets/InitialValues';
import { CustomTextField } from '../../../commons/CustomTextField';
import { ActionType } from '../../../commons/types/oversightTypes';
import {
  getDateFromString,
  getTimeDuration,
  toTime,
} from '../../../commons/utils/DateFormatter';
import { campaignOversightFormValidationSchema } from '../../../commons/validation/CampaignOversightValidation';
import { Title } from '../CampaignOversightLogs/CampaignOversightLogs.Styles';
import {
  ButtonWrapper,
  ConfigWrapper,
  LeftWrapper,
  PacingBodyWrapper,
  PacingHeaderWrapper,
  RightWrapper,
  Wrapper,
} from './CampaignOversightForm.Styles';
import { ISchedule } from '../../../commons/types/schedulerTypes';
import { IDialerDefaults } from '../../../commons/types/globalTypes';
import { OversightStats } from 'lcme-common/lib/types/oversight-stats';
import { IAccounts } from '../../../commons/types/commonTypes';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#FF4136',
    },
  },
});

interface ICampaignOversightForm {
  selectedRow: OversightStats & {
    prjacc?: IAccounts;
  };
  dialerDefaults: IDialerDefaults;
  onDiscardClick: () => void;
  controlScheduleExecution: (
    action: ActionType,
    scheduleExecutionId: string,
    callback: (info: any) => void,
    runtimeParameters: any,
  ) => void;
  onAccountChange: (url: string) => any;
  schedules: ISchedule[];
}

export const CampaignOversightForm: React.FunctionComponent<
  ICampaignOversightForm
> = ({
  selectedRow,
  controlScheduleExecution,
  onDiscardClick,
  dialerDefaults,
  onAccountChange,
  schedules,
}) => {
  const [readOnly, setReadOnly] = useState(true);
  const [openAlert, setOpenAlert] = useState(false);
  const [selectedScheduleExecution, setSelectedScheduleExecution] =
    useState<OversightStats | null>(selectedRow);

  const [configAccount, setConfigAccount] = useState<any>();

  const handleClose = () => {
    setOpenAlert(false);
  };

  useEffect(() => {
    PubSub.unsubscribe('campaign_oversight_pane_status');
    PubSub.subscribe('campaign_oversight_pane_status', (topic, msg) => {
      if (msg === false && !readOnly) {
        setOpenAlert(true);
        PubSub.publish('campaign_oversight_form_status', false);
      } else {
        PubSub.publish('campaign_oversight_form_status', true);
      }
    });
  }, [readOnly]);

  const handleConfirmation = (submitForm) => {
    submitForm();
    handleClose();
  };

  const handleDiscard = (setValues, values?) => {
    setFormValues(setValues, values);
    setReadOnly(true);
    onDiscardClick();
    setSelectedScheduleExecution(null);
  };

  const handleSubmit = (submitForm: Function) => {
    submitForm();
  };

  useEffect(() => {
    setSelectedScheduleExecution(selectedRow);
    if (selectedRow && selectedRow.prjacc) {
      setConfigAccount(accounts.find((a) => a.url === selectedRow.prjacc?.url));
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

  const setFormValues = (setValues, values) => {
    const overridePacing = schedules.find(
      (sched) => sched.id === selectedScheduleExecution?.scheduleId,
    )?.PacingOverride?.ConcurrentCalls;
    setValues({
      initialCallsPerAgent: selectedScheduleExecution?.pacing?.InitialCPA || 0,
      initialCpaMode: selectedScheduleExecution?.pacing?.InitialCPAMode || '',
      maxPerAgent: selectedScheduleExecution?.pacing?.MaxCPA || 0,
      initialPacing: selectedScheduleExecution?.pacing?.InitialDuration || 0,
      aBAIncrement: selectedScheduleExecution?.pacing?.AbaIncrement || 0,
      cPAModifier: selectedScheduleExecution?.pacing?.CpaModifier || 0,
      aBACalculation: selectedScheduleExecution?.pacing?.AbaCalculation || '',
      aBATargetRate: selectedScheduleExecution?.pacing?.AbaTargetRate || 0,
      ...(selectedScheduleExecution?.campaignMode === 'agentless' &&
        selectedScheduleExecution?.pacing?.ConcurrentCalls &&
        selectedScheduleExecution?.pacing?.ConcurrentCalls != null &&
        !isNaN(selectedScheduleExecution?.pacing?.ConcurrentCalls) && {
          concurrentCalls:
            selectedScheduleExecution.pacing?.ConcurrentCalls || 0,
        }),
      // concurrentCalls: selectedScheduleExecution?.Pacing?.ConcurrentCalls || 0,
      concurrentCalls:
        selectedScheduleExecution?.pacing?.ConcurrentCalls || overridePacing,
      weight: selectedScheduleExecution?.campaignWeight || 0,
      endTime: toTime(new Date(selectedScheduleExecution?.endTime || 0)),
    });
  };

  const onSend = (value, resetForm) => {
    const oldEndDate = new Date(selectedScheduleExecution?.endTime || 0);
    const startDate = new Date(selectedScheduleExecution?.startTime || 0);
    const newEndDate = getDateFromString(oldEndDate, value?.endTime || '00:00');

    const runtimeParameters =
      selectedScheduleExecution?.campaignMode === 'power'
        ? {
            pacing: {
              InitialCPAMode: value?.initialCpaMode,
              MaxCPA: value?.maxPerAgent,
              AbaCalculation: value?.aBACalculation,
              AbaIncrement: value?.aBAIncrement,
              AbaTargetRate: value?.aBATargetRate,
              CpaModifier: value?.cPAModifier,
              InitialCPA: value?.initialCallsPerAgent,
              InitialDuration: value?.initialPacing,
              ConcurrentCalls: value?.concurrentCalls,
            },
            weight: value?.weight,
            duration:
              Math.floor(
                (getTimeDuration(startDate, newEndDate) as number) / 60000,
              ) || 0,
          }
        : {
            pacing: {
              AbaIncrement: value?.aBAIncrement,
              AbaTargetRate: value?.aBATargetRate,
              CpaModifier: value?.cPAModifier,
              InitialCPA: value?.initialCallsPerAgent,
              InitialDuration: value?.initialPacing,
              ConcurrentCalls: value?.concurrentCalls,
            },
            weight: value?.weight,
            duration:
              Math.floor(
                (getTimeDuration(startDate, newEndDate) as number) / 60000,
              ) || 0,
          };

    if (selectedScheduleExecution) {
      controlScheduleExecution(
        'UPDATE_RUNTIME_PARAMETERS',
        selectedRow?.scheduleExecutionId,
        (data) => {
          setReadOnly(true);
          localStorage.setItem('onEditMode', '0');
        },
        runtimeParameters,
      );
    }
  };

  return (
    <MuiThemeProvider theme={theme}>
      <Wrapper>
        <LeftWrapper>
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
              disabled
            />
          </ConfigWrapper>
          <Divider />
          <Formik
            initialValues={campaignOversightFormInitialValues}
            validationSchema={campaignOversightFormValidationSchema(
              dialerDefaults,
              selectedScheduleExecution!,
            )}
            onSubmit={(values, { setSubmitting, resetForm }) => {
              setSubmitting(false);

              onSend(values, resetForm);
            }}
          >
            {({ submitForm, isSubmitting, values, setValues, errors }) => (
              <Form>
                {useEffect(() => {
                  setTimeout(() => {
                    setFormValues(setValues, values);
                  }, 400);
                }, [selectedScheduleExecution])}
                <PacingHeaderWrapper>
                  <Title>Pacing</Title>
                </PacingHeaderWrapper>
                <PacingBodyWrapper isReadOnly={readOnly}>
                  <PacingForm
                    isScheduleExecution={true}
                    oversightMode={selectedScheduleExecution?.campaignMode}
                    // isCampaignConfig={false}
                    formValues={values}
                    errors={errors}
                  ></PacingForm>
                  <br />
                  <CustomTextField
                    name='endTime'
                    label='End Time'
                    type='time'
                    fullWidth
                  />
                </PacingBodyWrapper>
                <ButtonWrapper>
                  {readOnly ? (
                    <>
                      <Button
                        variant='contained'
                        color='secondary'
                        onClick={() => {
                          setReadOnly(false);
                          localStorage.setItem('onEditMode', '1');
                        }}
                      >
                        Override Pacing
                      </Button>
                    </>
                  ) : (
                    <>
                      <Tooltip title={'Save Changes'}>
                        <Button
                          variant='contained'
                          color='primary'
                          onClick={() => {
                            handleSubmit(submitForm);
                          }}
                        >
                          <Save />
                        </Button>
                      </Tooltip>

                      <Tooltip title={'Discard Changes'}>
                        <Button
                          variant='contained'
                          color='secondary'
                          onClick={() => handleDiscard(setValues)}
                        >
                          <Close />
                        </Button>
                      </Tooltip>
                    </>
                  )}
                </ButtonWrapper>
                <Dialog
                  open={openAlert}
                  onClose={() => {
                    handleClose();
                    // handlePaneClose();
                  }}
                  aria-labelledby='alert-delete'
                  aria-describedby='alert-dialog-description'
                >
                  <DialogTitle id='alert-delete'>
                    Unsaved Configuration
                  </DialogTitle>
                  <DialogContent>
                    <DialogContentText id='alert-dialog-description'>
                      Do you want to save the configuration before closing?
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button
                      onClick={() => {
                        handleClose();
                      }}
                      color='primary'
                    >
                      No
                    </Button>
                    <Button
                      onClick={() => {
                        handleConfirmation(submitForm);
                      }}
                      color='primary'
                      autoFocus
                    >
                      Yes
                    </Button>
                  </DialogActions>
                </Dialog>
              </Form>
            )}
          </Formik>
        </LeftWrapper>
        <RightWrapper></RightWrapper>
      </Wrapper>
    </MuiThemeProvider>
  );
};

CampaignOversightForm.defaultProps = {
  // bla: 'test',
};
