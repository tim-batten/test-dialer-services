/* eslint-disable no-empty-pattern */
import React, { useState, useEffect, useMemo } from 'react';
import {
  ButtonWrapper,
  ConfigWrapper,
  FormWrapper,
  Title,
  Wrapper,
} from './FilterConfigurator.Styles';
import {
  Button,
  Divider,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@material-ui/core';
import { Form, Formik, Field } from 'formik';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { SubName } from '../../commons/style/MUI.Styles';
import { filterSortValidationSchema } from '../../commons/validation/FilterSortValidation';
import { filterSortInitialValues } from '../../commons/assets/InitialValues';
import { ConfigurationForm } from '../ConfigurationForm';
import { SQLForm } from '../SQLForm';
import { EditableTextField } from '../../commons/EditableTextField';
import { IFilter } from '../../commons/types/filterTypes';
import { IFilterClass } from '../../commons/assets/InitialValues';
import { AccessRoles } from '../../../constants';
import { TSeverity } from '../../commons/types/commonTypes';
import { AccountSelector } from '../../commons/AccountSelector';
import { accounts } from '../../../frontend-config';
import {
  config_baseURL,
  set_config_baseURL,
  baseURL,
} from '../../../api/utils';

interface IFilterConfigurator {
  contactLists?: any;
  handleDiscard: Function;
  filters: any;
  addFilter: (filter: IFilter) => void;
  validateFilter: (filter: IFilter, callback: (data: any) => void) => void;
  creating: boolean;
  selectedRow: any;
  readOnly: boolean;
  updateFilterByID: (
    editedFilterConfig: IFilter,
    id: string,
    initialFilterConfig: IFilter,
  ) => void;
  copied: boolean;
  returnedRecords: {
    timestamp: string;
    returnedRecords: any;
  };
  onAlert: (message: string, severity: TSeverity) => void;
  onAccountChange: (url: string) => any;
}

export const FilterConfigurator: React.FunctionComponent<
  IFilterConfigurator
> = ({
  contactLists,
  handleDiscard,
  addFilter,
  filters,
  creating,
  selectedRow,
  updateFilterByID,
  copied,
  readOnly,
  validateFilter,
  returnedRecords,
  onAlert,
  onAccountChange,
}) => {
  const [step] = useState(0);
  const [openStepOne, setOpenStepOne] = useState(true);
  const [openStepTwo, setOpenStepTwo] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState(selectedRow);
  const [openAlert, setOpenAlert] = useState({
    title: '',
    message: '',
    status: false,
  });
  const [filterType, setFilterType] = useState('');
  const [filterOrSort, setFilterOrSort] = useState('');
  const [configAccount, setConfigAccount] = useState<any>();

  // useMemo(() => {
  //   if (openAlert.status === true) {
  //     if (returnedRecords.returnedRecords.isSuccess) {
  //       const { Total } = returnedRecords.returnedRecords.data.returnData[0];
  //       const message =
  //         filterOrSort === 'sort'
  //           ? 'Total = 0, your sort is successful'
  //           : `${Total} ${
  //               filterType === 'Account' || filterType === 'phone'
  //                 ? 'phone numbers'
  //                 : 'contacts'
  //             } match your filter`;
  //       setOpenAlert({ title: 'Validated Records', message, status: true });
  //     } else if (!returnedRecords.returnedRecords.isSuccess) {
  //       setOpenAlert({
  //         title: 'Validation Error',
  //         message: returnedRecords.returnedRecords.statusMessage,
  //         status: true,
  //       });
  //     }
  //   }
  // }, [returnedRecords.returnedRecords]);

  const onValidate = (data: any) => {
    const returnedRecords = data.action.payload.data[0];
    if (returnedRecords.isSuccess) {
      const { Total } = returnedRecords.data.returnData[0];
      const message =
        filterOrSort === 'sort'
          ? 'Total = 0, your sort is successful'
          : `${Total} ${
              filterType === 'Account' || filterType === 'phone'
                ? 'phone numbers'
                : 'contacts'
            } match your filter`;
      setOpenAlert({ title: 'Validated Records', message, status: true });
    } else if (!returnedRecords.isSuccess) {
      setOpenAlert({
        title: 'Validation Error',
        message: returnedRecords.statusMessage,
        status: true,
      });
    }
  };
  const handleDiscardForm = (resetForm: Function) => {
    resetForm();
    handleDiscard();
    setSelectedFilter(null);
  };

  const handleSubmit = (submitForm: Function) => {
    submitForm();
  };

  const handleClose = () => {
    setOpenAlert({ title: '', message: '', status: false });
  };

  useEffect(() => {
    setSelectedFilter(selectedRow);
    if (selectedRow && selectedRow.prjacc) {
      setConfigAccount(accounts.find((a) => a.url === selectedRow.prjacc.url));
      set_config_baseURL(selectedRow.prjacc.url);
    } else if (selectedRow && JSON.stringify(selectedRow) !== '{}') {
      setConfigAccount(accounts.find((a) => a.url === baseURL()));
      onAccountChange(baseURL());
      set_config_baseURL(baseURL());
    } else {
      setConfigAccount(accounts.find((a) => a.url === config_baseURL()));
      onAccountChange(config_baseURL());
    }
  }, [selectedRow]);

  const onSend = (value, resetForm) => {
    const filter: IFilter = {
      filterName: value.filterName,
      tableCL: value.tableCL,
      filterType: value.filterType,
      filterOrSort: value.filterOrSort,
      filterSQL: value.filterSQL,
    };
    if (!creating && !copied) {
      updateFilterByID(filter, selectedRow.id, selectedFilter);
    } else {
      addFilter(filter);
    }
    handleDiscardForm(resetForm);
  };

  const setFormValues = (setValues) => {
    const filter: IFilter = selectedFilter;
    if (filter && Object.keys(filter).length > 0) {
      const template: IFilterClass = {
        filterName: filter.filterName,
        filterType: filter.filterType,
        tableCL: filter.tableCL,
        filterOrSort: filter.filterOrSort,
        filterSQL: filter.filterSQL,
        sqlInput: 'freeform',
      };
      setValues(template);
    }
  };
  const checkFilterName = (formValues) => {
    let lowerCheck = formValues.filterName.toLowerCase();
    let filterCheck = filters.filter((fil) => {
      return fil.filterName.toLowerCase() === lowerCheck;
    });
    return (
      filterCheck.length === 0 ||
      (filterCheck.length > 0 &&
        !creating &&
        formValues.filterName === selectedFilter?.filterName)
    );
  };

  return (
    <FormWrapper>
      <Formik
        initialValues={filterSortInitialValues}
        validationSchema={filterSortValidationSchema}
        onSubmit={(values, { setSubmitting, resetForm }) => {
          if (!checkFilterName(values)) {
            onAlert(
              'This Filter Name is already in use please use a new one',
              'warning',
            );
          } else {
            onSend(values, resetForm);
          }
          setSubmitting(false);
        }}
      >
        {({
          submitForm,
          isSubmitting,
          resetForm,
          setValues,
          values,
          setFieldValue,
          touched,
          errors,
        }) => (
          <Form>
            {useEffect(() => {
              setTimeout(() => {
                setFormValues(setValues);
              }, 200);
            }, [selectedFilter])}
            <Title variant='h5' gutterBottom>
              <Field
                name='filterName'
                label='Filter Name'
                component={EditableTextField}
              />
              <SubName variant='body2'>
                {selectedFilter && selectedFilter.id}
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
                  Configuration
                </StepLabel>
                <StepContent>
                  <ConfigurationForm
                    readOnly={readOnly}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    errors={errors}
                    contactLists={contactLists}
                  />
                </StepContent>
              </Step>
              <Step active={openStepTwo}>
                <StepLabel
                  onClick={() => {
                    setOpenStepTwo(!openStepTwo);
                  }}
                >
                  SQL
                </StepLabel>
                <StepContent>
                  <SQLForm setFieldValue={setFieldValue} formValues={values} />
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
                      onClick={() => handleDiscardForm(resetForm)}
                    >
                      {readOnly ? 'Close' : 'Discard'}
                    </Button>
                    <Button
                      variant='contained'
                      color='primary'
                      onClick={() => {
                        const filter: IFilter = {
                          filterName: values.filterName,
                          tableCL: values.tableCL,
                          filterType: values.filterType,
                          filterOrSort: values.filterOrSort,
                          filterSQL: values.filterSQL,
                        };
                        setFilterType(values.filterType);
                        setFilterOrSort(values.filterOrSort);
                        validateFilter(filter, (data) => {
                          //  console.log('validation-data', data);
                          onValidate(data);
                        });
                        // setTimeout(() => {
                        //   setOpenAlert({
                        //     title: '',
                        //     message: '',
                        //     status: true,
                        //   });
                        // }, 300);
                      }}
                    >
                      Validate
                    </Button>
                  </ButtonWrapper>
                </StepContent>
              </Step>
            </Stepper>
            <Dialog
              open={openAlert.status}
              onClose={() => handleClose()}
              aria-labelledby='alert-name'
              aria-describedby='alert-dialog-description'
            >
              <DialogTitle id='alert-name'>{openAlert.title}</DialogTitle>
              <DialogContent>
                <DialogContentText id='alert-dialog-description'>
                  {openAlert.message}
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => handleClose()} color='primary'>
                  Confirm
                </Button>
              </DialogActions>
            </Dialog>
          </Form>
        )}
      </Formik>
    </FormWrapper>
  );
};

FilterConfigurator.defaultProps = {
  // bla: 'test',
};
