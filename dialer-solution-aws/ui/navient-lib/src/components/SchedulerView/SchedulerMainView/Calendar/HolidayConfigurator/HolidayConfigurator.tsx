import {
  Button,
  Step,
  StepContent,
  StepLabel,
  Stepper,
} from '@material-ui/core';
import Divider from '@material-ui/core/Divider';
import { Field, Form, Formik } from 'formik';
import { CheckboxWithLabel } from 'formik-material-ui';
import React, { useEffect, useState } from 'react';
import { holidayInitialValues } from '../../../../commons/assets/InitialValues';
import { CustomTextField } from '../../../../commons/CustomTextField';
import { EditableTextField } from '../../../../commons/EditableTextField';
import { SnackbarComponent } from '../../../../commons/SnackbarComponent';
import {
  IFormHoliday,
  IHoliday,
  IHolidayID,
} from '../../../../commons/types/holidayTypes';
import { holidayValidationSchema } from '../../../../commons/validation/HolidayValidation';
import { Title } from '../../SchedulerMainView.Styles';
import {
  ButtonWrapper,
  FormWrapper,
  Wrapper,
} from './HolidayConfigurator.Styles';
import { TextGroupWrapper } from './Schedule/Schedule.Styles';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { TSeverity } from '../../../../commons/types/commonTypes';
import { ConfigWrapper } from '../../../SchedulerConfigurator/SchedulerConfigurator.Styles';
import { AccountSelector } from '../../../../commons/AccountSelector';
import { accounts } from '../../../../../frontend-config';
import { config_baseURL, set_config_baseURL } from '../../../../../api/utils';

interface IHolidayConfigurator {
  title?: string;
  holidays: IHolidayID[];
  onDiscardClick: Function;
  onSubmit: (obj: any) => void;
  creating: boolean;
  addHoliday: (holiday: IHoliday, discard: () => void) => void;
  updateHoliday: (
    holiday: IHoliday,
    initialHoliday: IHolidayID,
    discard: () => void,
  ) => void;
  deleteHoliday: (id: string, discard: () => void) => void;
  holiday: IHolidayID;
  setSelectedHD: (any) => void;
  onAlert: (message: string, severity: TSeverity) => void;
  onAccountChange: (url: string) => any;
}

export const HolidayConfigurator: React.FunctionComponent<
  IHolidayConfigurator
> = ({
  onDiscardClick,
  onSubmit,
  creating,
  addHoliday,
  updateHoliday,
  deleteHoliday,
  holiday,
  holidays,
  setSelectedHD,
  onAlert,
  onAccountChange,
}) => {
  const [clickStatus, setClickStatus] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(holiday);
  const [openAlert, setOpenAlert] = useState(false);
  const [configAccount, setConfigAccount] = useState<any>();

  const handleDiscard = (resetForm: Function) => {
    resetForm();
    onDiscardClick();
    setSelectedHD(null);
    setClickStatus(false);
  };

  const handleSubmit = (submitForm: Function) => {
    submitForm();
    // setOpenSnack(true);
  };

  const handleClose = (_event?: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnack(false);
  };

  const onSend = (values: IFormHoliday, resetForm: () => void) => {
    const temp: IHoliday = {
      Date: values.date,
      HolidayName: values.holidayConfigName,
      RepeatAnnually: values.repeatAnnually,
    };
    if (creating) {
      addHoliday(temp, () => {
        handleDiscard(resetForm);
      });
    } else {
      updateHoliday(temp, holiday, () => {
        handleDiscard(resetForm);
      });
    }
  };

  useEffect(() => {

    setSelectedHoliday(holiday);

    if (holiday && holiday['prjacc']) {
      setConfigAccount(accounts.find((a) => a.url === holiday['prjacc'].url));
      set_config_baseURL(holiday['prjacc'].urll);
    } else {
      setConfigAccount(accounts.find((a) => a.url === config_baseURL()));
    }
  }, [holiday]);

  const setFormValues = (setValues) => {
    const _holiday: IHolidayID = holiday;
    if (_holiday) {
      const formHoliday: IFormHoliday = {
        holidayConfigName: _holiday.HolidayName,
        date: _holiday.Date,
        repeatAnnually: _holiday.RepeatAnnually,
      };
      setValues(formHoliday);
    }
  };

  const handleAlertClose = () => {
    setOpenAlert(false);
  };

  const checkHolidayName = (formValues: IFormHoliday) => {
    let lowerCheck = formValues.holidayConfigName.toLowerCase();
    let holidayCheck = holidays.filter((hol) => {
      return hol.HolidayName.toLowerCase() === lowerCheck;
    });
    return (
      holidayCheck.length === 0 ||
      (holidayCheck.length > 0 &&
        !creating &&
        formValues.holidayConfigName === holiday?.HolidayName)
    );
  };
  return (
    <Wrapper>
      <FormWrapper>
        <Formik
          initialValues={holidayInitialValues}
          validationSchema={holidayValidationSchema}
          onSubmit={(values, { setSubmitting, resetForm }) => {
            if (checkHolidayName(values)) {
              onSend(values, resetForm);
            } else {
              onAlert(
                'This Holiday Name is already in use please use a new one',
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
            values,
            setFieldValue,
            touched,
            errors,
            setValues,
          }) => (
            <Form>
              {useEffect(() => {
                setTimeout(() => {
                  setFormValues(setValues);
                }, 400);
              }, [selectedHoliday])}
              <Title variant='h5' gutterBottom>
                <Field
                  name='holidayConfigName'
                  label='Holiday Name'
                  component={EditableTextField}
                />
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
              <Stepper activeStep={0} orientation='vertical'>
                <Step expanded>
                  <StepLabel>Holiday Schedule</StepLabel>
                  <StepContent>
                    {/* <Schedule
                      values={values}
                      setFieldValue={setFieldValue}
                      touched={touched}
                      errors={errors}
                    /> */}
                    <TextGroupWrapper>
                      <CustomTextField
                        name='date'
                        label='Date'
                        type='date'
                        fullWidth
                      />
                      <Field
                        component={CheckboxWithLabel}
                        type='checkbox'
                        name='repeatAnnually'
                        Label={{
                          label: 'Repeat Annually',
                          labelPlacement: 'end',
                        }}
                      />
                    </TextGroupWrapper>
                  </StepContent>
                </Step>
                <Step expanded>
                  <StepContent>
                    <ButtonWrapper>
                      <Button
                        variant='contained'
                        color='primary'
                        disabled={isSubmitting}
                        onClick={() => {
                          handleSubmit(submitForm);
                        }}
                      >
                        {creating === true ? 'Create' : 'Update'}
                      </Button>

                      {!creating && (
                        <Button
                          variant='contained'
                          color='primary'
                          onClick={() => {
                            setOpenAlert(true);
                            // handleDiscard(resetForm);
                          }}
                        >
                          Delete
                        </Button>
                      )}
                      <Button
                        variant='contained'
                        color='primary'
                        onClick={() => handleDiscard(resetForm)}
                      >
                        Discard
                      </Button>
                    </ButtonWrapper>
                    <SnackbarComponent
                      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                      open={openSnack}
                      autoHideDuration={3000}
                      onAlertClose={handleClose}
                      alertMessage={
                        isSubmitting || clickStatus
                          ? 'Holiday Saved!'
                          : 'Holiday Save Failed!'
                      }
                      severity={
                        isSubmitting || clickStatus ? 'success' : 'error'
                      }
                    />
                  </StepContent>
                </Step>
              </Stepper>
            </Form>
          )}
        </Formik>
      </FormWrapper>
      <Dialog
        open={openAlert}
        onClose={() => handleAlertClose()}
        aria-labelledby='alert-delete'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-delete'>{`Delete ${holiday?.HolidayName}?`}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Are you sure you want to delete this holiday?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleAlertClose()} color='primary'>
            Disagree
          </Button>
          <Button
            onClick={() => {
              deleteHoliday(holiday?.id, () => {
                handleDiscard(() => {});
              });
            }}
            color='primary'
            autoFocus
          >
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    </Wrapper>
  );
};

HolidayConfigurator.defaultProps = {
  // bla: 'test',
  title: 'Create Schedule',
};
