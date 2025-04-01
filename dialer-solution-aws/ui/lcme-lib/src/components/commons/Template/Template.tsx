/* eslint-disable no-empty-pattern */
import React from 'react';
import { Wrapper } from './Template.Styles';

interface ITemplate {}

export const Template: React.FunctionComponent<ITemplate> = ({}) => {
  return <Wrapper>Template context</Wrapper>;
};

Template.defaultProps = {
  // bla: 'test',
};
