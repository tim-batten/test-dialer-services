/* eslint-disable no-empty-pattern */
import { Button, DialogActions, DialogContent, DialogTitle, Paper } from '@material-ui/core';
import React from 'react';
import Draggable from 'react-draggable';
import { IndependentDialog, Wrapper } from './DraggableDialog.Styles';


const PaperComponent: React.FunctionComponent = (props) => {
  return (
    <Draggable handle="#draggable-dialog-title" cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} />
    </Draggable>
  );
}

interface IDraggableDialog {
  open: boolean;
  title: string;
  onClose: (event: {}, reason: "backdropClick" | "escapeKeyDown") => void;
  hideBackdrop: boolean;
  actions?: { title: string, onClick: () => void }[];
  scroll?: 'body' | 'paper';
  children?: React.ReactNode;
  disableBackdropClick?: boolean;
}


export const DraggableDialog: React.FunctionComponent<IDraggableDialog> = ({ open, title, onClose, hideBackdrop, actions, scroll, children, disableBackdropClick }) => {

  return <Wrapper>
    <IndependentDialog
      scroll={scroll}
      open={open}
      onClose={onClose}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
      hideBackdrop={hideBackdrop}
      disableBackdropClick={disableBackdropClick}
    >
      <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        {children}
      </DialogContent>
      {actions?.length && <DialogActions>
        {
          actions.map(action => <Button autoFocus onClick={() => action.onClick()} color="primary">{action.title}</Button>)
        }
      </DialogActions>
      }
    </IndependentDialog>
  </Wrapper>;
};

DraggableDialog.defaultProps = {
  // bla: 'test',
};
