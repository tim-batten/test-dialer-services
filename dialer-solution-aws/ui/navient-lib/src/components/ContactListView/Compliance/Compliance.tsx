/* eslint-disable no-empty-pattern */
import React from 'react';
import { CustomFormikNumberField } from '../../commons/CustomFormikNumberField';
import { TextWrapper, Wrapper } from './Compliance.Styles';

interface ICompliance {}

export const ComplianceForm: React.FunctionComponent<ICompliance> = ({}) => {
  return (
    <Wrapper>
      <TextWrapper>
        <CustomFormikNumberField
          name='dailyCallLimitRecord'
          label='Daily Call Limit - Record'
          fullWidth
        />
        <CustomFormikNumberField
          name='dailyCallLimitPhone'
          label='Daily Call Limit - Phone'
          fullWidth
        />
      </TextWrapper>
    </Wrapper>
  );
};

ComplianceForm.defaultProps = {};
