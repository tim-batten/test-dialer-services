import { values } from 'lodash';
import * as Yup from 'yup';

export const configValidationSchema = () => {
  return Yup.object().shape({
    scheduleTimezone: Yup.string()
      .matches(/^(?!(none)$)/, 'Required')
      .required('Required'),
    contactFlowId: Yup.string().required('Required'),
    abandonmentIncrementMin: Yup.number()
      .min(0, 'Must be a positive number')
      .max(99999, 'Cannot exceed 99999')
      .required('Required'),
    abandonmentIncrementMax: Yup.number()
      .min(0, 'Must be a positive number')
      .max(99999, 'Cannot exceed 99999')
      .required('Required'),
    cpaModifierMin: Yup.number()
      .min(0, 'Must be a positive number')
      .max(99999, 'Cannot exceed 99999')
      .required('Required'),
    cpaModifierMax: Yup.number()
      .min(0, 'Must be a positive number')
      .max(99999, 'Cannot exceed 99999')
      .required('Required'),
    abaTargetRateMin: Yup.number()
      .min(0, 'Must be a positive number')
      .max(99999, 'Cannot exceed 99999')
      .required('Required'),
    abaTargetRateMax: Yup.number()
      .min(0, 'Must be a positive number')
      .max(99999, 'Cannot exceed 99999')
      .required('Required'),
    concurrentCallsMin: Yup.number()
      .integer('Must be a whole number')
      .min(0, 'Must be a positive number')
      .max(99999, 'Cannot exceed 99999')
      .required('Required'),
    concurrentCallsMax: Yup.number()
      .integer('Must be a whole number')
      .min(0, 'Must be a positive number')
      .max(99999, 'Cannot exceed 99999')
      .required('Required'),
    initialPacingDurationMin: Yup.number()
      .integer('Must be a whole number')
      .min(0, 'Must be greater than 0')
      .max(99999, 'Must not exceed 99999')
      .required('Required'),
    initialPacingDurationMax: Yup.number()
      .integer('Must be a whole number')
      .min(0, 'Must be a positive number')
      .max(99999, 'Cannot exceed 99999')
      .required('Required'),
    initialPacingSamplesMin: Yup.number()
      .integer('Must be a whole number')
      .min(0, 'Must be greater than 0')
      .max(99999, 'Must not exceed 99999')
      .required('Required'),
    initialPacingSamplesMax: Yup.number()
      .integer('Must be a whole number')
      .min(0, 'Must be a positive number')
      .max(99999, 'Cannot exceed 99999')
      .required('Required'),
    maxCpa: Yup.number()
      .min(0, 'Must be a positive number')
      .max(99999, 'Cannot exceed 99999')
      .required('Required'),
    initialCpa: Yup.array().required('Required'),
    callLimitRecord: Yup.array().required('Required'),
    callLimitPhone: Yup.array().required('Required'),
    scheduleLoops: Yup.array().required('Required'),
  });
};

