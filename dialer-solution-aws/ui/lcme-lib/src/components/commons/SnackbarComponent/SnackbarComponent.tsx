/* eslint-disable no-unused-vars */
import Snackbar, { SnackbarProps } from '@material-ui/core/Snackbar';
import MuiAlert, { AlertProps, Color } from '@material-ui/lab/Alert';
import React from 'react';

type TSnackbarComponent = SnackbarProps & {
  alertMessage: React.ReactNode;
  severity: Color;
  onAlertClose: () => void;
};

function Alert(props: AlertProps) {
  return <MuiAlert elevation={6} variant='filled' {...props} />;
}

export const SnackbarComponent: React.FunctionComponent<TSnackbarComponent> = (
  props,
) => {
  return (
    <Snackbar {...props} onClose={() => props.onAlertClose()}>
      <Alert onClose={() => props.onAlertClose()} severity={props.severity}>
        {props.alertMessage}
      </Alert>
    </Snackbar>
  );
};

SnackbarComponent.defaultProps = {
  // bla: 'test',
};
