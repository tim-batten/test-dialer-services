import { Field } from 'formik';
import React from 'react';
import { RangeSliderComponent } from './RangeSliderComponent';

interface IRangeSliderComponentContainer {
  initialValues?: [number, number];
  range: [number, number];
  name: string;
  label: string;
  half?: Boolean;
}

export const RangeSliderComponentContainer: React.FunctionComponent<
  IRangeSliderComponentContainer
> = (props) => {
  return <Field {...props} component={RangeSliderComponent} />;
};

RangeSliderComponentContainer.defaultProps = {
  // bla: 'test',
};
