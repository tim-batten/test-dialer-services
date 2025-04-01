/* eslint-disable no-empty-pattern */
import { Button, IconButton, Typography } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { Close } from '@material-ui/icons';
import React, { useEffect, useState } from 'react';
import {
  allDataFilter,
  config_baseURL,
  isBaseURLAll,
  set_config_baseURL,
} from '../../../api/utils';
import { AccessRoles } from '../../../constants/AccessLevel';
import { AccountSelector } from '../../commons/AccountSelector';
import { CustomMaterialTable } from '../../commons/CustomMaterialTable';
import { SideBarComponent } from '../../commons/SideBarComponent';
import { SnackbarComponent } from '../../commons/SnackbarComponent';
import { IAccounts } from '../../commons/types/commonTypes';
import { IContactList } from '../../commons/types/contactListTypes';
import { ContactListConfigurator } from '../ContactListConfigurator';
import { Title } from '../ContactListConfigurator/ContactListConfigurator.Styles';
import {
  ButtonWrapper,
  Content,
  TitleWrapper,
  Wrapper,
} from './ContactListMainView.Styles';
import { ContactListTable } from './ContactListTable';
import { IDialerDefaults } from '../../commons/types/globalTypes';

interface IContactListMainView {
  dialerDefaults: IDialerDefaults;
  contactLists: any;
  accessLevel: any;
  selectedAccount: IAccounts | undefined | 'All';
  setAccount: (account: IAccounts | undefined | 'All') => void;
  getContactLists: () => void;
  deleteContactListByID: (id: string, callback: (info: any) => void) => void;
  updateContactListByID: (
    editedContactListConfig: IContactList,
    id: string,
    callback: (info: any) => void,
    initialContactListConfig: IContactList,
  ) => void;
  addContactList: (
    contactList: IContactList,
    callback: (info: any) => void,
  ) => void;
  getDialerDefaults: () => void;
}

export const ContactListMainView: React.FunctionComponent<
  IContactListMainView
> = ({
  dialerDefaults:tempDialerDefaults,
  contactLists,
  selectedAccount,
  setAccount,
  getContactLists,
  deleteContactListByID,
  updateContactListByID,
  addContactList,
  accessLevel,
  getDialerDefaults,
}) => {
  const [readOnly, setReadOnly] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [selectedContactList, setSelectedContactList] = useState({});
  const [creating, setCreating] = useState(false);
  const [rowData, setRowData] = useState(contactLists);
  const [copied, setCopied] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [dataId, setDataId] = useState('');
  const [severity, setSeverity] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('success');
  const [openDependencyList, setOpenDependencyList] = useState(false);
  const [dependents, setDependents] = useState([]);
  const [dialerDefaults, setGlobalDefaults] = useState<any>(tempDialerDefaults);
  const [accountURL, setAccountURL] = useState<any>();

  useEffect(() => {
    if (Array.isArray(tempDialerDefaults)) {
      const temp = tempDialerDefaults.find(
        (tg) => tg.prjacc.url === config_baseURL(),
      );
      setGlobalDefaults(temp);
    } else {
      setGlobalDefaults(tempDialerDefaults);
    }
  }, [accountURL, tempDialerDefaults]);

  const handleOnRowDoubleClick = (row: any, isEdit: Boolean) => {
    handleOpenSideBar();
    if (!isEdit) {
      setCopied(true);
      setCreating(true);
    } else if (isEdit) {
      setCreating(false);
      setCopied(false);
    }
    setSelectedContactList(row);
  };

  const handleDeleteClick = (id: any) => {
    deleteContactListByID(id, (data) => {
      handleDeleteCallback(data);
    });
  };

  const handleOpenSideBar = (readOnly?: boolean) => {
    setOpenSidebar(true);
    if (
      !readOnly &&
      accessLevel !== AccessRoles.READ_ONLY &&
      accessLevel !== AccessRoles.ANALYST
    )
      localStorage.setItem('onEditMode', '1');
  };

  const handleOpenSnack = () => {
    setOpenSnack(true);
  };
  const handleCloseSnack = (_event?: React.SyntheticEvent, reason?: string) => {
    setOpenSnack(false);
  };

  useEffect(() => {
    getContactLists();
    getDialerDefaults();
  }, [selectedAccount]);

  useEffect(() => {
    setRowData(contactLists);
  }, [contactLists]);

  const handleUpdateCallback = (data) => {
    const status = data.action.type;

    if (status === 'UPDATE_CONTACT_LIST_FULFILLED') {
      setSnackMessage('Contact List Updated!');
      setSeverity('success');
    } else if (data.errorMessage && data.errorMessage.includes('409')) {
      setSnackMessage('Data state is stale; refresh & retry!');
      setSeverity('error');
    } else {
      setSnackMessage('Contact List Update Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  const handleAddCallback = (data) => {
    const status = data.action.type;
    if (status === 'ADD_CONTACT_LIST_FULFILLED') {
      setSnackMessage('Contact List Created!');
      setSeverity('success');
    } else {
      setSnackMessage('Contact List Creation Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  const handleDeleteCallback = (data) => {
    const status = data.action.type;
    const response = data?.response;
    if (status === 'DELETE_CONTACT_LIST_FULFILLED') {
      setSnackMessage('Contact List Deleted!');
      setSeverity('success');
      setOpenSnack(true);
      setOpenDependencyList(false);
    } else if (response?.status !== 409) {
      setSnackMessage('Contact List Deletion Failed!');
      setSeverity('error');
      setOpenSnack(true);
    } else {
      setDependents(response?.data?.dependents?.dependents?.campaigns);
      setOpenDependencyList(true);
    }
  };

  const handleDiscard = () => {
    setOpenSidebar(false);
    setReadOnly(false);
    setSelectedContactList({});
    localStorage.setItem('onEditMode', '0');
  };

  const alertReadOnly = () => {
    setSnackMessage('Access Denied');
    setSeverity('info');
    setOpenSnack(true);
  };

  const handleClose = () => {
    setOpenAlert(false);
  };

  const onHandleCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(dependents));
    setSnackMessage('Copied to Clipboard');
    setSeverity('success');
    setOpenSnack(true);
  };

  return (
    <Wrapper>
      <TitleWrapper>
        <Title variant='h6'>Contact Lists</Title>
        <ButtonWrapper>
          <AccountSelector
            initialValue={selectedAccount}
            onValueChange={(data) => setAccount(data)}
            disabled={openSidebar}
          />
          <Button
            variant='contained'
            disabled={openSidebar}
            color='primary'
            onClick={() => {
              setCreating(true);
              setSelectedContactList({});
              handleOpenSideBar();
            }}
          >
            {accessLevel === AccessRoles.ANALYST ||
            accessLevel === AccessRoles.READ_ONLY
              ? 'See Form'
              : 'New Contact List'}
          </Button>
        </ButtonWrapper>
      </TitleWrapper>
      <SideBarComponent
        topOffSet={47}
        open={openSidebar}
        readonly={
          readOnly ||
          accessLevel === AccessRoles.READ_ONLY ||
          accessLevel === AccessRoles.ANALYST
        }
        component={
          <ContactListConfigurator
            readOnly={
              readOnly ||
              accessLevel === AccessRoles.ANALYST ||
              accessLevel === AccessRoles.READ_ONLY
            }
            onDiscardClick={() => handleDiscard()}
            contactLists={allDataFilter(contactLists)}
            title={(selectedContactList as any).name}
            creating={creating as any}
            copied={copied as any}
            selectedRow={selectedContactList}
            updateContactListByID={(
              editedContactListConfig: IContactList,
              id: string,
              initialContactListConfig: IContactList,
            ) =>
              updateContactListByID(
                editedContactListConfig,
                id,
                (data) => {
                  handleUpdateCallback(data);
                },
                initialContactListConfig,
              )
            }
            addContactList={(contactList: IContactList) =>
              addContactList(contactList, (data) => {
                handleAddCallback(data);
              })
            }
            handleOpenSnack={handleOpenSnack}
            dialerDefaults={dialerDefaults}
            onAlert={(data, severity) => {
              setSnackMessage(data);
              setSeverity(severity);
              setOpenSnack(true);
            }}
            onAccountChange={(url) => setAccountURL(url)}
          />
        }
      >
        <Content>
          <ContactListTable
            onRowDoubleClick={(_row: any, isEdit: Boolean) => {
              if (
                accessLevel === AccessRoles.READ_ONLY ||
                accessLevel === AccessRoles.ANALYST
              ) {
                alertReadOnly();
              } else {
                handleOnRowDoubleClick(_row, isEdit);
              }
            }}
            viewRow={(_row: any) => {
              setReadOnly(true);
              handleOpenSideBar(true);
              setSelectedContactList(_row);
            }}
            deleteRow={(_id: any) => {
              if (
                accessLevel === AccessRoles.READ_ONLY ||
                accessLevel === AccessRoles.ANALYST
              ) {
                alertReadOnly();
              } else {
                setOpenAlert(true);
                setDataId(_id);
                const aContact = contactLists.find((c) => c.id === _id);
                if (isBaseURLAll() && aContact.prjacc) {
                  set_config_baseURL(aContact.prjacc.url);
                }
              }
            }}
            rowData={rowData}
            openSidebar={openSidebar}
          />
        </Content>
        <SnackbarComponent
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          open={openSnack}
          autoHideDuration={5000}
          onAlertClose={handleCloseSnack}
          alertMessage={snackMessage}
          severity={severity}
        />
      </SideBarComponent>

      <Dialog
        open={openAlert}
        onClose={() => handleClose()}
        aria-labelledby='alert-delete'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-delete'>Delete Contact List</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Are you sure you want to delete this contact list configuration?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose()} color='primary'>
            Disagree
          </Button>
          <Button
            onClick={() => {
              handleClose();
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
          <Typography variant='h6'>Cannot Delete - See Dependents</Typography>
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
                { label: 'Campaign ID', value: 'campaignId' },
                { label: 'Campaign Name', value: 'campaignName' },
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

ContactListMainView.defaultProps = {
  // bla: 'test',
};
