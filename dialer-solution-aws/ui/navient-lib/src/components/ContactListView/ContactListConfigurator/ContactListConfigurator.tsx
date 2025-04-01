import {
  Button,
  Divider,
  Step,
  StepContent,
  StepLabel,
  Stepper,
} from '@material-ui/core';
import { Field, Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import {
  contactListInitialValues,
  IContactListsClass,
} from '../../commons/assets/InitialValues';
import { EditableTextField } from '../../commons/EditableTextField';
import { SubName } from '../../commons/style/MUI.Styles';
import { IContactList } from '../../commons/types/contactListTypes';
import { contactListValidationSchema } from '../../commons/validation/ContactListValidation';
import { ComplianceForm } from '../Compliance';
import { MainForm } from '../Main';
import {
  ButtonWrapper,
  ConfigWrapper,
  FormWrapper,
  Title,
  Wrapper,
} from './ContactListConfigurator.Styles';
import { TSeverity } from '../../commons/types/commonTypes';
import { AccountSelector } from '../../commons/AccountSelector';
import { accounts } from '../../../frontend-config';
import {
  config_baseURL,
  set_config_baseURL,
  baseURL,
} from '../../../api/utils';
import { IDialerDefaults } from '../../commons/types/globalTypes';

interface IContactListConfigurator {
  title?: string;
  onDiscardClick: Function;
  creating?: Boolean;
  contactLists: any;
  dialerDefaults: IDialerDefaults;
  copied?: Boolean;
  selectedRow: any;
  readOnly: boolean;
  updateContactListByID: (
    contactList: IContactList,
    id: string,
    selectedContactList: IContactList,
  ) => void;
  addContactList: (contactList: IContactList) => void;
  handleOpenSnack: () => void;
  onAlert: (message: string, severity: TSeverity) => void;
  onAccountChange: (url: string) => any;
}

export const ContactListConfigurator: React.FunctionComponent<
  IContactListConfigurator
> = ({
  onDiscardClick,
  creating,
  contactLists,
  copied,
  selectedRow,
  readOnly,
  updateContactListByID,
  addContactList,
  handleOpenSnack,
  dialerDefaults,
  onAlert,
  onAccountChange,
}) => {
  const [step] = useState(0);
  const [openStepOne, setOpenStepOne] = useState(true);
  const [openStepTwo, setOpenStepTwo] = useState(true);
  const [selectedContactList, setSelectedContactList] = useState(selectedRow);
  const [configAccount, setConfigAccount] = useState<any>();

  const handleDiscard = (resetForm: Function) => {
    resetForm();
    onDiscardClick();
    setSelectedContactList(null);
  };

  const handleSubmit = (submitForm: Function) => {
    submitForm();
  };

  useEffect(() => {
    setSelectedContactList(selectedRow);
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
    const contactList: IContactList = selectedContactList;

    if (contactList && Object.keys(contactList).length > 0) {
      const template: IContactListsClass = {
        contactListConfigName: contactList.ContactListConfigName,
        contactListTable: contactList.ContactListTable,
        phoneListTable: contactList.PhoneListTable,
        doNotCallTable: contactList.DncTable,
        dncUniqueRecordIdentifier: contactList.DncIdentifier,
        phoneTypes: contactList.PhoneTypes.toString(),
        dailyCallLimitRecord: contactList.Compliance.DailyCallLimitRecord,
        dailyCallLimitPhone: contactList.Compliance.DailyCallLimitPhone,
      };

      setValues(template);
    }
  };

  const onSend = (value: IContactListsClass, resetForm) => {
    const phoneTypeValues = value.phoneTypes.split(',');
    const contactList: IContactList = {
      ContactListConfigName: value.contactListConfigName,
      ContactListTable: value.contactListTable,
      PhoneListTable: value.phoneListTable,
      DncTable: value.doNotCallTable,
      DncIdentifier: value.dncUniqueRecordIdentifier,
      PhoneTypes: phoneTypeValues,
      Compliance: {
        DailyCallLimitRecord: value.dailyCallLimitRecord,
        DailyCallLimitPhone: value.dailyCallLimitPhone,
      },
    };

    if (!creating && !copied) {
      updateContactListByID(contactList, selectedRow.id, selectedContactList);
    } else {
      addContactList(contactList);
    }

    handleDiscard(resetForm);
  };

  const checkContactName = (formValues) => {
    let lowerCheck = formValues.contactListConfigName.toLowerCase();
    let contactCheck = contactLists.filter((contact) => {
      return contact.ContactListConfigName.toLowerCase() === lowerCheck;
    });
    return (
      contactCheck.length === 0 ||
      (contactCheck.length > 0 &&
        !creating &&
        formValues.contactListConfigName ===
          selectedContactList?.ContactListConfigName)
    );
  };

  return (
    <Wrapper>
      <FormWrapper>
        <Formik
          initialValues={contactListInitialValues}
          validationSchema={contactListValidationSchema(dialerDefaults)}
          onSubmit={(
            values: IContactListsClass,
            { setSubmitting, resetForm },
          ) => {
            if (checkContactName(values)) {
              onSend(values, resetForm);
            } else {
              onAlert(
                'This Contact List Name is already in use please use a new one',
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
          }) => (
            <Form>
              {useEffect(() => {
                setTimeout(() => {
                  setFormValues(setValues);
                }, 400);
              }, [selectedContactList])}
              <Title variant='h5' gutterBottom>
                <Field
                  name='contactListConfigName'
                  label='Contact List'
                  component={EditableTextField}
                />
                <SubName variant='body2'>
                  {selectedContactList && selectedContactList.id}
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
                    <MainForm formValues={values} creating={creating as any} />
                  </StepContent>
                </Step>
                <Step active={openStepTwo}>
                  <StepLabel
                    onClick={() => {
                      setOpenStepTwo(!openStepTwo);
                    }}
                  >
                    Compliance
                  </StepLabel>
                  <StepContent>
                    <ComplianceForm />
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

ContactListConfigurator.defaultProps = {
  title: 'Contact List Name',
};
