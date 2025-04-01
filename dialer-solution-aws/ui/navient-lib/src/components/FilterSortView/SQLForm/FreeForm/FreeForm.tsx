import React, { useEffect, useState } from 'react';
import { TextareaAutosize } from '@material-ui/core';
import { Wrapper, CustomHelperText } from './FreeForm.Styles';

interface IFreeForm {
  values: any;
  setFieldValue: Function;
}

export const FreeForm: React.FunctionComponent<IFreeForm> = ({
  values,
  setFieldValue,
}) => {
  const [filterSQL, setFilterSQL] = useState('SQL Input');
  useEffect(() => {
    setFilterSQL(values.filterSQL);
  }, [values.filterSQL]);

  const handleChange = (event) => {
    setFieldValue('filterSQL', event.target.value);
    setFilterSQL(event.target.value);
  };
  return (
    <Wrapper>
      <TextareaAutosize
        aria-label='SQL Input'
        minRows={3}
        maxRows={10}
        value={filterSQL}
        onChange={handleChange}
        placeholder='SQL Input'
      />
    </Wrapper>
  );
};
