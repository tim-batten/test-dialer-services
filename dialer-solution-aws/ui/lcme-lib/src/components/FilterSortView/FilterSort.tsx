import React, { useState, useEffect } from 'react';
import {
  TitleWrapper,
  Title,
  Wrapper,
  ButtonWrapper,
} from './FilterSort.Styles';
import { Button, IconButton, Typography } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { FilterConfigurator } from './FilterConfigurator';
import { BottomSlidingPane } from '../commons/BottomSlidingPane';
import PubSub from 'pubsub-js';
import { FilterTable } from './FilterTable';
import { IFilter } from '../commons/types/filterTypes';
import { SnackbarComponent } from '../commons/SnackbarComponent';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { CustomMaterialTable } from '../commons/CustomMaterialTable';
import { AccessRoles, READ_ONLY } from '../../constants';
import { AccountSelector } from '../commons/AccountSelector';
import { IAccounts } from '../commons/types/commonTypes';
import {
  allDataFilter,
  isBaseURLAll,
  set_config_baseURL,
  set_account_override,
  config_baseURL,
} from '../../api/utils';
import useNoInitialEffect from '../../hooks/react-mod-hooks';
import { access } from 'fs';

interface IFilterSort {
  title?: string;
  onDiscardClick?: Function;
  contactLists?: any;
  selectedAccount: IAccounts | undefined | 'All';
  getContactLists: () => void;
  filters: any;
  setAccount: (account: IAccounts | undefined | 'All') => void;
  getFilters: () => void;
  addFilter: (filter: IFilter, callback: (info: any) => void) => void;
  validateFilter: (filter: IFilter, callback: (info: any) => void) => void;
  deleteFilterByID: (id: string, callback: (info: any) => void) => void;
  updateFilterByID: (
    editedFilterConfig: IFilter,
    id: string,
    callback: (info: any) => void,
    initialFilterConfig: IFilter,
  ) => void;
  accessLevel: AccessRoles;
  returnedRecords: {
    timestamp: string;
    returnedRecords: any;
  };
}

export const FilterSortMainView: React.FunctionComponent<IFilterSort> = ({
  onDiscardClick,
  contactLists,
  getContactLists,
  getFilters,
  filters,
  selectedAccount,
  setAccount,
  addFilter,
  deleteFilterByID,
  updateFilterByID,
  accessLevel,
  validateFilter,
  returnedRecords,
}) => {
  const [readOnly, setReadOnly] = useState(false);
  const [open, setOpen] = useState(false);
  const [filterData, setFilterData] = useState(filters);
  const [selectedFilter, setSelectedFilter] = useState({});
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [openDependencyList, setOpenDependencyList] = useState(false);
  const [dependents, setDependents] = useState([]);
  const [dataId, setDataId] = useState('');
  const [severity, setSeverity] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('success');
  const [accountURL, setAccountURL] = useState<any>(config_baseURL());

  const handleDiscard = () => {
    setOpen(false);
    setReadOnly(false);
    setSelectedFilter({});
    localStorage.setItem('onEditMode', '0');
  };

  const handlePaneOpen = (readOnly?: boolean) => {
    setOpen(true);
    if (!readOnly && accessLevel !== AccessRoles.READ_ONLY)
      localStorage.setItem('onEditMode', '1');
  };
  const handleOpenSnack = () => {
    setOpenSnack(true);
  };
  const handleCloseSnack = (_event?: React.SyntheticEvent, reason?: string) => {
    setOpenSnack(false);
  };
  const handleCloseAlert = () => {
    setOpenAlert(false);
  };

  useEffect(() => {
    getContactLists();
    getFilters();
  }, [selectedAccount]);

  useEffect(() => {
    setFilterData(filters);
  }, [filters]);

  useNoInitialEffect(() => {
    set_account_override('1');
    getContactLists();

    return () => set_account_override('0');
  }, [accountURL]);

  const handleAddCallback = (data) => {
    const status = data.action.type;
    if (status === 'ADD_FILTER_FULFILLED') {
      setSnackMessage('Filter Created!');
      setSeverity('success');
    } else if (status === 'VALIDATE_FILTER_FULFILLED') {
      return;
    } else {
      setSnackMessage('Filter Operation Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  const handleUpdateCallback = (data) => {
    const status = data.action.type;

    if (status === 'UPDATE_FILTER_FULFILLED') {
      setSnackMessage('Filter Updated!');
      setSeverity('success');
    } else if (data.errorMessage && data.errorMessage.includes('409')) {
      setSnackMessage('Data state is stale; refresh & retry!');
      setSeverity('error');
    } else {
      setSnackMessage('Filter Update Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  const handleDeleteCallback = (data) => {
    const status = data.action.type;
    const response = data?.response;
    if (status === 'DELETE_FILTER_FULFILLED') {
      setSnackMessage('Filter Deleted!');
      setSeverity('success');
      setOpenSnack(true);
    } else if (
      response?.status !== 409 &&
      status !== 'DELETE_FILTER_FULFILLED'
    ) {
      setSnackMessage('Filter Deletion Failed!');
      setSeverity('error');
      setOpenSnack(true);
    } else {
      setSnackMessage('Filter Delete Cannot Be Completed');
      setSeverity('warning');
      setOpenSnack(true);
      setDependents(response.data.dependents.dependents.schedules);
      setOpenDependencyList(true);
    }
  };

  const handleDeleteClick = (id) => {
    deleteFilterByID(id, (data) => {
      handleDeleteCallback(data);
    });
  };

  const onHandleCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(dependents));
    setSnackMessage('Copied to Clipboard');
    setSeverity('success');
    setOpenSnack(true);
  };

  const handleOnRowEdit = (row: any, isEdit: Boolean) => {
    handlePaneOpen();
    if (!isEdit) {
      setCopied(true);
      setCreating(true);
    } else if (isEdit) {
      setCreating(false);
      setCopied(false);
    }
    setSelectedFilter(row);
  };
  const alertReadOnly = () => {
    setSnackMessage('Access Denied');
    setSeverity('info');
    setOpenSnack(true);
  };

  return (
    <Wrapper>
      <TitleWrapper>
        <Title variant='h6'>Filter and Sort</Title>
        <ButtonWrapper>
          <AccountSelector
            initialValue={selectedAccount}
            onValueChange={(data) => setAccount(data)}
            disabled={open}
          />
          <Button
            variant='contained'
            color='primary'
            disabled={open}
            onClick={() => {
              setCreating(true);
              setSelectedFilter({});
              handlePaneOpen();
            }}
          >
            {accessLevel === AccessRoles.READ_ONLY ? 'See Form' : 'New Filter'}
          </Button>
        </ButtonWrapper>
      </TitleWrapper>
      <BottomSlidingPane
        title={creating ? 'Create New Filter' : 'Update Filter'}
        topOffSet={126}
        // readonly={readOnly || accessLevel === AccessRoles.READ_ONLY}
        open={open}
        onClose={() => handleDiscard()}
        component={
          <FilterConfigurator
            readOnly={readOnly || accessLevel === AccessRoles.READ_ONLY}
            returnedRecords={returnedRecords}
            filters={allDataFilter(filters)}
            contactLists={allDataFilter(contactLists)}
            creating={creating}
            handleDiscard={() => handleDiscard()}
            addFilter={(filter: IFilter) => {
              addFilter(filter, (data) => {
                handleAddCallback(data);
              });
            }}
            validateFilter={(
              filter: IFilter,
              callback: (data: any) => void,
            ) => {
              validateFilter(filter, (data) => {
                callback(data);
                handleAddCallback(data);
              });
            }}
            updateFilterByID={(
              editedFilterConfig: IFilter,
              id: string,
              initialFilterConfig: IFilter,
            ) =>
              updateFilterByID(
                editedFilterConfig,
                id,
                (data) => {
                  handleUpdateCallback(data);
                },
                initialFilterConfig,
              )
            }
            copied={copied}
            selectedRow={selectedFilter}
            onAlert={(data, severity) => {
              setSnackMessage(data);
              setSeverity(severity);
              setOpenSnack(true);
            }}
            onAccountChange={(url) => setAccountURL(url)}
          />
        }
      >
        <FilterTable
          filterData={filterData}
          contactLists={contactLists}
          openBar={open}
          deleteRow={(_id: any) => {
            if (accessLevel === AccessRoles.READ_ONLY) {
              alertReadOnly();
            } else {
              setOpenAlert(true);
              setDataId(_id);
              const aFilter = filters.find((f) => f.id === _id);
              if (isBaseURLAll() && aFilter.prjacc) {
                set_config_baseURL(aFilter.prjacc.url);
              }
            }
          }}
          viewRow={(_row: any) => {
            setReadOnly(true);
            handlePaneOpen(true);
            setSelectedFilter(_row);
          }}
          handleOnRowEdit={(_row: any, isEdit: Boolean) => {
            if (accessLevel === AccessRoles.READ_ONLY) {
              alertReadOnly();
            } else {
              handleOnRowEdit(_row, isEdit);
            }
          }}
        />
      </BottomSlidingPane>
      <SnackbarComponent
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        open={openSnack}
        autoHideDuration={6000}
        onAlertClose={handleCloseSnack}
        alertMessage={snackMessage}
        severity={severity}
      />
      <Dialog
        open={openAlert}
        onClose={() => handleCloseAlert()}
        aria-labelledby='alert-delete'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-delete'>Delete Filter</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Are you sure you want to delete this filter?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseAlert()} color='primary'>
            Disagree
          </Button>
          <Button
            onClick={() => {
              handleCloseAlert();
              handleDeleteClick(dataId);
            }}
            color='primary'
            autoFocus
          >
            Agree
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openDependencyList}
        onClose={() => setOpenDependencyList(false)}
        aria-labelledby='alert-delete'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle
          disableTypography
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 5,
          }}
        >
          <Typography variant='h6'>Dependents</Typography>
          <IconButton
            aria-label='close'
            onClick={() => setOpenDependencyList(false)}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <DialogContentText id='alert-dialog-description'>
            <CustomMaterialTable
              rows={dependents}
              columns={[
                { label: 'Schedule ID', value: 'scheduleId' },
                { label: 'Schedule Name', value: 'scheduleName' },
              ]}
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onHandleCopyToClipboard()} color='primary'>
            Copy To Clipboard
          </Button>
        </DialogActions>
      </Dialog>
    </Wrapper>
  );
};

FilterSortMainView.defaultProps = {};
