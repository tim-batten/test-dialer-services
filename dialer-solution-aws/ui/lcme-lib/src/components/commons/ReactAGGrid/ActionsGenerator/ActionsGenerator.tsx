/* eslint-disable no-empty-pattern */
import { IconButton, Tooltip } from '@material-ui/core';
import React from 'react';
import { IActions } from '../ReactAGGrid';
import { Wrapper } from './ActionsGenerator.Styles';

interface IActionsGenerator {
  rowData: any;
  actions: IActions[];
}

export const ActionsGenerator: React.FunctionComponent<IActionsGenerator> = ({
  rowData,
  actions,
}) => {
  return (
    <Wrapper>
      {actions.map((actions) => {
        const { icon: Icon, tooltip, disabled, onClick } = actions;
        return (
          <Tooltip title={tooltip}>
            <IconButton
              aria-label='upload picture'
              disabled={disabled}
              onClick={() => onClick(rowData, rowData.data)}
              size='small'
            >
              <Icon />
            </IconButton>
          </Tooltip>
        );
      })}
    </Wrapper>
  );
};

ActionsGenerator.defaultProps = {
  // bla: 'test',
};
