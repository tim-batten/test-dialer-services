/* eslint-disable no-empty-pattern */
import { Field } from 'formik';
import React from 'react';
import { CustomAttributeField } from './CustomAttributeField';
import { Wrapper } from './CustomAttributes.Styles';

interface ICustomAttributes {}

export const CustomAttributes: React.FunctionComponent<ICustomAttributes> =
  ({}) => {
    return (
      <Wrapper>
        <Field component={CustomAttributeField} name='customAttributes' />
      </Wrapper>
    );
  };

CustomAttributes.defaultProps = {
  // bla: 'test',
};
