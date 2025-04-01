/* eslint-disable no-empty-pattern */
import { Button, Divider } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react';
import { ICampaignGroup } from '../../../commons/types/campaignTypes';
import {
  ButtonWrapper,
  CustomTextField,
  GridWrapper,
  Wrapper,
} from './Groups.Styles';

interface IGroups {
  open: boolean;
  onClose: () => void;
  onAddGroup: (group: ICampaignGroup) => void;
  onEditGroup: (group: ICampaignGroup, id: string, initialGroup: any) => void;
  onDeleteGroup: (id: string) => void;
  isReadOnly: boolean;
  groups: any;
}

interface RowProps {
  id: string;
  name: string;
}

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Group Name',
    flex: 1,
    editable: true,
  },
];

export const Groups: React.FunctionComponent<IGroups> = ({
  open,
  onClose,
  groups,
  isReadOnly,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
}) => {
  const [openModal, setOpenModal] = useState(open);
  const [name, setName] = useState('');
  const [error, setError] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  const handleClose = () => {
    setOpenModal(false);
    onClose();
  };

  useEffect(() => {
    setOpenModal(open);
  }, [open]);

  useEffect(() => {
    reSetNameValue();
  }, [groups]);

  const getNameError = (): string => {
    let _error = '';
    if (groups.find((r) => r.name === name)) {
      _error = 'Already Exists';
    }
    return _error;
  };

  const reSetNameValue = () => {
    setName('');
  };

  const addAttributes = () => {
    onAddGroup({ name: name });
  };

  const editGroups = (data) => {
    const row = groups.find((row) => row.id === data.id);
    onEditGroup({ name: data.value }, data.id, row);
  };

  const deleteAttributes = () => {
    var _rows: any[] = [...groups];

    selectedRows.forEach((row_id) => {
      onDeleteGroup(row_id);
    });
  };

  const onHandleName = (name: string) => {
    setName(name);
  };

  return (
    <Dialog
      open={openModal}
      onClose={() => handleClose()}
      aria-labelledby='alert-delete'
      aria-describedby='alert-dialog-description'
      maxWidth='md'
    >
      <DialogTitle id='alert-delete'>Groups</DialogTitle>
      <DialogContent>
        <DialogContentText id='alert-dialog-description'>
          <Wrapper>
            <GridWrapper>
              <DataGrid
                rows={groups}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                checkboxSelection
                disableSelectionOnClick
                autoHeight
                density='compact'
                onSelectionModelChange={(e) => setSelectedRows(e as any)}
                onCellEditCommit={(e) => {
                  editGroups(e);
                }}
              />
            </GridWrapper>
            <ButtonWrapper>
              <Button
                variant='outlined'
                color='primary'
                disabled={selectedRows.length <= 0}
                onClick={() => deleteAttributes()}
              >
                Delete Groups(s)
              </Button>
            </ButtonWrapper>
            <Divider />
            <ButtonWrapper>
              <CustomTextField
                label='Group Name'
                placeholder='Name'
                variant='outlined'
                margin='dense'
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  notched: false,
                }}
                value={name}
                onChange={(e) => onHandleName(e.target.value)}
                error={
                  !!groups.find((r) => r.name === name) || (error && !name)
                }
                helperText={getNameError()}
              />
            </ButtonWrapper>
            <ButtonWrapper>
              <Button
                variant='contained'
                color='primary'
                onClick={() => {
                  if (groups.find((r) => r.name === name) || !name) {
                    setError(true);
                  } else {
                    setError(false);
                    addAttributes();
                  }
                }}
              >
                Add New Group
              </Button>
            </ButtonWrapper>
            <Divider />
          </Wrapper>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose()} color='primary'>
          Close
        </Button>
        {/* <Button disabled={isReadOnly} color='primary' autoFocus>
          Save
        </Button> */}
      </DialogActions>
    </Dialog>
  );
};

Groups.defaultProps = {
  // bla: 'test',
};
