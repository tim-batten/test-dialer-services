import React, { useState } from 'react';
import { TextWrapper, Wrapper } from './SQLForm.Styles';
import { BuilderSQL } from './Builder';
import { FreeForm } from './FreeForm';

interface ISQLForm {
  formValues: any;
  setFieldValue: Function;
}

export const SQLForm: React.FunctionComponent<ISQLForm> = ({
  formValues,
  setFieldValue,
}) => {
  return (
    <Wrapper>
      <TextWrapper>
        <FreeForm values={formValues} setFieldValue={setFieldValue} />
        {/* {formValues?.sqlInput === 'freeform' ? (
          <FreeForm values={formValues} setFieldValue={setFieldValue} />
        ) : null}
        {formValues?.sqlInput === 'builder' ? <BuilderSQL /> : null} */}
      </TextWrapper>
    </Wrapper>
  );
};

SQLForm.defaultProps = {};
