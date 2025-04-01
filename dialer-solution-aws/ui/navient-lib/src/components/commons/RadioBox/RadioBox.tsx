/* eslint-disable no-unused-vars */
import { Radio, RadioProps } from '@material-ui/core';
import { CheckBox, CheckBoxOutlineBlank } from '@material-ui/icons';
import React from 'react';

export const RadioBox: React.FunctionComponent<RadioProps> = (props) => {
  return (
    <Radio
      {...props}
      color='primary'
      checkedIcon={<CheckBox />}
      icon={<CheckBoxOutlineBlank />}
    />
  );
};
RadioBox.defaultProps = {
  // bla: 'test',
};
