import { Field } from 'formik';
import React from 'react';
import { IOption } from '../types/commonTypes';
import { DuoColumnSelector } from './DuoColumnSelector';

interface IDuoColumnSelectorContainer {
  name: string;
  label?: string;
  itemOptions: (string | IOption)[];
  onChange?: (values: string[]) => void;
  values?: string[];
  dependency?: any;
  doValueChange?: boolean;
}

export const DuoColumnSelectorContainer: React.FunctionComponent<
  IDuoColumnSelectorContainer
> = (props) => {
  return <Field {...props} component={DuoColumnSelector} />;
};

DuoColumnSelectorContainer.defaultProps = {
  // bla: 'test',
};
