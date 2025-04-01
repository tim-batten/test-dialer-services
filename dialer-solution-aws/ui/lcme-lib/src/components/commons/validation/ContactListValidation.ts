import * as Yup from 'yup';
import { IDialerDefaults } from '../types/globalTypes';

export const contactListValidationSchema = (dialerDefaults: IDialerDefaults) => {
  return Yup.object().shape({
    contactListConfigName: Yup.string()
      .min(3, 'Minimum length of 3')
      .max(200, 'Maximum length of 200')
      .matches(/^(?!(none)$)/, 'Required')
      .matches(
        /^[a-zA-Z_-][a-zA-Z0-9 _ -]*$/,
        "Use alphanumeric characters, '_' or '-'. Cannot start with a number",
      )
      .required('Required'),
    contactListTable: Yup.string()
      .min(3, 'Minimum length of 3')
      .max(200, 'Maximum length of 200')
      .matches(/^(?!(none)$)/, 'Required')
      .matches(
        /^[a-zA-Z_-][a-zA-Z0-9_-]*$/,
        "Use alphanumeric characters, '_' or '-'. Cannot start with a number",
      )
      .required('Required'),
    phoneListTable: Yup.string()
      .min(3, 'Minimum length of 3')
      .max(200, 'Maximum length of 200')
      .matches(/^(?!(none)$)/, 'Required')
      .matches(
        /^[a-zA-Z_-][a-zA-Z0-9_-]*$/,
        "Use alphanumeric characters, '_' or '-'. Cannot start with a number",
      )
      .required('Required'),
    doNotCallTable: Yup.string()
      .min(3, 'Minimum length of 3')
      .max(200, 'Maximum length of 200')
      .matches(/^(?!(none)$)/, 'Required')
      .matches(
        /^[a-zA-Z_-][a-zA-Z0-9_-]*$/,
        "Use alphanumeric characters, '_' or '-'. Cannot start with a number",
      )
      .required('Required'),
    dncUniqueRecordIdentifier: Yup.string()
      .min(3, 'Minimum length of 3')
      .max(200, 'Maximum length of 200')
      .matches(
        /^[a-zA-Z_-][a-zA-Z0-9_-]*$/,
        "Use alphanumeric characters, '_' or '-'. Cannot start with a number",
      )
      .matches(/^(?!(none)$)/, 'Required')
      .required('Required'),
    phoneTypes: Yup.string()
      .min(3, 'Minimum length of 3')
      .max(200, 'Maximum length of 200')
      .matches(
        /^([a-zA-Z_-]+,)*([a-zA-Z_-]+){1}$/i,
        "Values must be comma separated unless they are the final value i.e. 'abc,abc'",
      )
      .matches(/^(?!(none)$)/, 'Required')
      .required('Required'),
    dailyCallLimitRecord: Yup.number()
      .min(
        dialerDefaults?.CallLimitRecordMin,
        `Minimum Record is ${dialerDefaults?.CallLimitRecordMin}`,
      )
      .max(
        dialerDefaults?.CallLimitRecordMax,
        `Maximum Record is ${dialerDefaults?.CallLimitRecordMax}`,
      )
      .required('Required'),
    dailyCallLimitPhone: Yup.number()
      .min(
        dialerDefaults?.CallLimitPhoneMin,
        `Minimum Phone Limit is ${dialerDefaults?.CallLimitPhoneMin}`,
      )
      .max(
        dialerDefaults?.CallLimitPhoneMax,
        `Maximum Phone Limit is ${dialerDefaults?.CallLimitPhoneMax}`,
      )
      .required('Required'),
  });
};
