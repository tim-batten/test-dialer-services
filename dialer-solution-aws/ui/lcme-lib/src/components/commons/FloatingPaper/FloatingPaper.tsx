/* eslint-disable no-empty-pattern */
import { Button, DialogActions, Typography } from '@material-ui/core';
import React, { useEffect } from 'react';
import Draggable from 'react-draggable';
import { DragHandle, InnerContentWrapper, OuterContentWrapper, Wrapper } from './FloatingPaper.Styles';

interface IFloatingPaper {
  title: string;
  actions?: { title: string, onClick: () => void }[];
  open: boolean;
  children?: React.ReactNode;
}

export const FloatingPaper: React.FunctionComponent<IFloatingPaper> = ({ title, actions, open, children }) => {
  return <Wrapper open={open}>
    <Draggable
      handle="#handle"
      defaultPosition={{ x: 0, y: 0 }}
      // grid={[1, 1]}
      scale={1}>
      <OuterContentWrapper elevation={3} >
        <DragHandle id="handle">
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
        </DragHandle>
        <InnerContentWrapper>
          {children}
        </InnerContentWrapper>
        {actions?.length &&
          <DialogActions>
            {
              actions.map(action => <Button autoFocus onClick={() => action.onClick()} color="primary">{action.title}</Button>)
            }
          </DialogActions>
        }
      </OuterContentWrapper>
    </Draggable>
  </Wrapper>;
};

FloatingPaper.defaultProps = {
  // bla: 'test',
};
