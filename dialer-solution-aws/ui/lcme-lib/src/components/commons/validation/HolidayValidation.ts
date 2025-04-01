import * as Yup from 'yup';

// .matches(/^[a-z0-9]+$/i, 'Alphanumeric characters only')

export const holidayValidationSchema = Yup.object().shape({
  holidayConfigName: Yup.string()
    .matches(/^(?!(none)$)/, 'Required')
    .required('Required'),
  // timeZone: Yup.string()
  //   .matches(/^(?!(none)$)/, 'Required')
  //   .required('Required'),
  // startDate: Yup.string()
  //   .matches(/^(?!(none)$)/, 'Required')
  //   .required('Required'),
  // startTime: Yup.string()
  //   .matches(/^(?!(none)$)/, 'Required')
  //   .required('Required'),
  // endTime: Yup.string()
  //   .matches(/^(?!(none)$)/, 'Required')
  //   .required('Required'),
  date: Yup.string()
    .matches(/^(?!(none)$)/, 'Required')
    .required('Required'),
});
