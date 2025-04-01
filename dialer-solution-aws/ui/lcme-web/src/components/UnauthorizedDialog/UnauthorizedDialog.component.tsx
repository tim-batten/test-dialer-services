import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import { AccessRoles } from '@lcme/common';
import { useAppSelector } from '../../redux/hook';

export interface IUnauthorizedDialog {
  role: AccessRoles;
  user: any;
  handleLogOut: () => void;
}

export const UnauthorizedDialog = ({ role, handleLogOut, user }: IUnauthorizedDialog) => {
  const rolePending = useAppSelector((state) => state.rolesAccess.pending);

  return (
    <Dialog
      open={(!role || role === AccessRoles.NONE) && !rolePending && Boolean(user)}
      onClose={() => handleLogOut()}
      aria-labelledby="alert-delete"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-delete">Not Authorized</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          You are not authorized to access this application. You will now be logged out.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleLogOut()} color="primary">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};
