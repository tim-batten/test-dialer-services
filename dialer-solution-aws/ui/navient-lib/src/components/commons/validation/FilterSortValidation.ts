import * as Yup from 'yup';

export const filterSortValidationSchema = () => {
  return Yup.object().shape({
    filterName: Yup.string().required('Filter Name is Required'),
    tableCL: Yup.string().required('Contact List is Required'),
    filterType: Yup.string().required('Filter Type is Required'),
    filterOrSort: Yup.string().required('Filter Or Sort is Required'),
    filterSQL: Yup.string().required('SQL Input is Required'),
  });
};
