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
  set_account_override,
} from '../../../api/utils';
import { AccessRoles } from '../../../constants/AccessLevel';
import useNoInitialEffect from '../../../hooks/react-mod-hooks';
import { AccountSelector } from '../../commons/AccountSelector';
import { CustomMaterialTable } from '../../commons/CustomMaterialTable';
import { SideBarComponent } from '../../commons/SideBarComponent';
import { SnackbarComponent } from '../../commons/SnackbarComponent';
import {
  CampaignDependents,
  ICampaign,
  ICampaignGroup,
} from '../../commons/types/campaignTypes';
import { IAccounts } from '../../commons/types/commonTypes';
import { CampaignConfigurator } from '../CampaignConfigurator';
import { Title } from '../CampaignConfigurator/CampaignConfigurator.Styles';
import { CampaignListTable } from './CampaignListTable';
import {
  ButtonWrapper,
  Content,
  TitleWrapper,
  Wrapper,
} from './CampaignMainView.Styles';
import { ContactFlowInfo } from '../../../types/connect-contact-flow';
import { ConnectQueueInfo } from '../../../types/connect-queue';
import { IDialerDefaults } from '../../commons/types/globalTypes';
import { PhoneNumberInfo } from 'navient-common/lib/types/phone-numbers';

interface ICampaignMainView {
  campaigns: (ICampaign & {
    prjacc?: IAccounts;
  })[];
  campaignDeps: any;
  campaignGroups: any[];
  selectedAccount: IAccounts | undefined | 'All';
  queues: ConnectQueueInfo[];
  contactLists: any;
  availableCallerIDs: PhoneNumberInfo[];
  contactFlows: ContactFlowInfo[];
  contactList: any;
  dialerDefaults: IDialerDefaults;
  accessLevel: any;
  setAccount: (account: IAccounts | undefined | 'All') => void;
  getCampaigns: () => void;
  getGroups: () => void;
  getQueues: () => void;
  getContactLists: () => void;
  getAvailableCallerIDs: () => void;
  getContactFlowList: () => void;
  getDialerDefaults: () => void;
  deleteCampaignByID: (
    id: string,
    cascade: boolean,
    callback: (info: any) => void,
  ) => void;
  updateCampaignByID: (
    editedCampaignConfig: ICampaign,
    id: string,
    callback: (info: any) => void,
    initialCampaignConfig: ICampaign,
  ) => void;
  addCampaign: (campaign: ICampaign, callback: (info: any) => void) => void;

  addGroup: (campaign: ICampaignGroup, callback: (info: any) => void) => void;
  updateGroup: (
    group: ICampaignGroup,
    id: string,
    callback: (info: any) => void,
    initialGroup: any,
  ) => void;
  deleteGroupByID: (id: string, callback: (info: any) => void) => void;
  getOneContactList: (contactListID: string) => any;
}

// TODO: create common interface for row
export const CampaignMainView: React.FunctionComponent<ICampaignMainView> = ({
  campaigns,
  campaignDeps,
  campaignGroups,
  selectedAccount,
  setAccount,
  queues,
  contactLists,
  availableCallerIDs,
  contactFlows,
  contactList,
  accessLevel,
  getCampaigns,
  getGroups,
  getQueues,
  getContactLists,
  getAvailableCallerIDs,
  getDialerDefaults,
  getContactFlowList,
  deleteCampaignByID,
  updateCampaignByID,
  addCampaign,
  getOneContactList,
  dialerDefaults:tempDialerDefaults,
  addGroup,
  updateGroup,
  deleteGroupByID,
}) => {
  const [readOnly, setReadOnly] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState({});
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [rowData, setRowData] = useState(campaigns);
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [openAlert, setOpenAlert] = useState(false);
  const [openDependencyList, setOpenDependencyList] = useState(false);
  const [openGroupDependencyList, setOpenGroupDependencyList] = useState(false);
  const [groupDependencyTitle, setGroupDependencyTitle] = useState('');
  const [dependents, setDependents] = useState<CampaignDependents>({
    cascadeDeletable: true,
    dependents: {
      scheduleExecutions: [],
      schedules: [],
    },
  });

  const [groupDependents, setGroupDependents] = useState([]);
  const [dataId, setDataId] = useState('');
  const [severity, setSeverity] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('success');
  const [dialerDefaults, setGlobalDefaults] = useState<any>(tempDialerDefaults);
  const [accountURL, setAccountURL] = useState<any>(config_baseURL());

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

  useNoInitialEffect(() => {
    set_account_override('1');
    if (!isBaseURLAll()) {
      getQueues();
      getContactLists();
      getAvailableCallerIDs();
      getContactFlowList();
      getDialerDefaults();
      getGroups();
    }
    return () => set_account_override('0');
  }, [accountURL]);

  const handleOnRowDoubleClick = (row: any, isEdit: Boolean) => {
    handleOpenSideBar();
    if (!isEdit) {
      setCopied(true);
      setCreating(true);
    } else if (isEdit) {
      setCreating(false);
      setCopied(false);
    }
    setSelectedCampaign(row);
  };

  const handleDeleteClick = (id, cascade: boolean) => {
    deleteCampaignByID(id, cascade, (data) => {
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
    getCampaigns();
    getQueues();
    getContactLists();
    getAvailableCallerIDs();
    getContactFlowList();
    getDialerDefaults();
    getGroups();
  }, [selectedAccount]);

  useEffect(() => {
    setRowData(campaigns);
  }, [campaigns]);

  const handleUpdateCallback = (data) => {
    const status = data.action.type;

    if (status === 'UPDATE_CAMPAIGN_FULFILLED') {
      setSnackMessage('Campaign Updated!');
      setSeverity('success');
    } else if (data.errorMessage && data.errorMessage.includes('409')) {
      setSnackMessage('Data state is stale; refresh & retry!');
      setSeverity('error');
    } else {
      setSnackMessage('Campaign Update Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  const handleAddCallback = (data) => {
    const status = data.action.type;
    if (status === 'ADD_CAMPAIGN_FULFILLED') {
      setSnackMessage('Campaign Created!');
      setSeverity('success');
    } else {
      setSnackMessage('Campaign Creation Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  const handleDeleteCallback = (data) => {
    const status = data.action.type;
    const response = data?.response;
    if (status === 'DELETE_CAMPAIGN_FULFILLED') {
      setSnackMessage('Campaign Deleted!');
      setSeverity('success');
      setOpenSnack(true);
      setOpenDependencyList(false);
    } else if (response?.status !== 409) {
      setSnackMessage('Campaign Deletion Failed!');
      setSeverity('error');
      setOpenSnack(true);
    } else {
      setDependents(response?.data?.dependents);
      setOpenDependencyList(true);
    }
  };

  const handleDiscard = () => {
    setOpenSidebar(false);
    setReadOnly(false);
    setSelectedCampaign({});
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
  const onHandleGroupCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(groupDependents));
    setSnackMessage('Copied to Clipboard');
    setSeverity('success');
    setOpenSnack(true);
  };

  const handleAddGroupCallback = (data) => {
    const status = data.action.type;
    if (status === 'ADD_GROUP_FULFILLED') {
      setSnackMessage('Group Created!');
      setSeverity('success');
    } else {
      setSnackMessage('Group Creation Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  const handleUpdateGroupCallback = (data) => {
    const status = data.action.type;
    if (status === 'UPDATE_GROUP_FULFILLED') {
      setSnackMessage('Group Updated!');
      setSeverity('success');
    } else if (data.errorMessage && data.errorMessage.includes('409')) {
      setSnackMessage('Data state is stale; refresh & retry!');
      setSeverity('error');
    } else {
      setSnackMessage('Group Update Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  const handleGroupDeleteCallback = (data) => {
    const status = data.action.type;
    const response = data?.response;
    const groupName = campaignGroups.find(
      (row) => row.id === response?.id,
    )?.name;

    if (status === 'DELETE_GROUP_FULFILLED') {
      setSnackMessage('Group Deleted!');
      setSeverity('success');
      setOpenSnack(true);
      setOpenGroupDependencyList(false);
    } else if (response?.status !== 409) {
      setSnackMessage('Group Deletion Failed!');
      setSeverity('error');
      setOpenSnack(true);
    } else {
      setGroupDependents(response?.data.dependents.dependents.campaigns);
      setGroupDependencyTitle(groupName || '');
      setOpenGroupDependencyList(true);
    }
  };

  return (
    <Wrapper>
      <TitleWrapper>
        <Title variant='h6'>Campaigns</Title>
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
              setSelectedCampaign({});
              handleOpenSideBar();
            }}
          >
            {accessLevel === AccessRoles.ANALYST ||
            accessLevel === AccessRoles.READ_ONLY
              ? 'See Form'
              : 'New Campaign'}
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
          <CampaignConfigurator
            readOnly={
              readOnly ||
              accessLevel === AccessRoles.READ_ONLY ||
              accessLevel === AccessRoles.ANALYST
            }
            onDiscardClick={() => handleDiscard()}
            campaigns={campaigns}
            title={(selectedCampaign as any).name}
            creating={creating as any}
            copied={copied as any}
            groups={allDataFilter(campaignGroups)}
            queues={allDataFilter(queues)}
            contactLists={allDataFilter(contactLists)}
            availableCallerIDs={allDataFilter(availableCallerIDs)}
            contactFlows={allDataFilter(contactFlows)}
            contactList={contactList}
            getOneContactList={getOneContactList}
            dialerDefaults={dialerDefaults}
            accessLevel={accessLevel}
            selectedRow={selectedCampaign}
            updateCampaignByID={(
              editedCampaignConfig: ICampaign,
              id: string,
              initialCampaignConfig: ICampaign,
            ) => {
              return updateCampaignByID(
                editedCampaignConfig,
                id,
                (data) => {
                  handleUpdateCallback(data);
                },
                initialCampaignConfig,
              );
            }}
            addCampaign={(campaign: ICampaign) =>
              addCampaign(campaign, (data) => {
                handleAddCallback(data);
              })
            }
            onAddGroup={(group: ICampaignGroup) => {
              addGroup(group, (data) => {
                handleAddGroupCallback(data);
              });
            }}
            onEditGroup={(
              group: ICampaignGroup,
              id: string,
              initialGroup: any,
            ) => {
              updateGroup(
                group,
                id,
                (data) => {
                  handleUpdateGroupCallback(data);
                },
                initialGroup,
              );
            }}
            onDeleteGroup={(id: string) => {
              deleteGroupByID(id, (data) => {
                handleGroupDeleteCallback(data);
              });
            }}
            handleOpenSnack={handleOpenSnack}
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
          <CampaignListTable
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
              setSelectedCampaign(_row);
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
                const aCampaign = campaigns.find((c) => c.id === _id);
                if (isBaseURLAll() && aCampaign?.prjacc) {
                  set_config_baseURL(aCampaign.prjacc.url);
                }
              }
            }}
            rowData={rowData}
            openSidebar={openSidebar}
            campaigns={campaigns}
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
        <DialogTitle id='alert-delete'>Delete Campaign</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Are you sure you want to delete this campaign?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose()} color='primary'>
            Disagree
          </Button>
          <Button
            onClick={() => {
              handleClose();
              handleDeleteClick(dataId, false);
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
              rows={dependents?.dependents?.schedules?.concat(
                dependents?.dependents?.scheduleExecutions?.map((s) => ({
                  scheduleId: `[Execution] ${s.id}`,
                  scheduleName: 'n/a',
                })),
              )}
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
          <Button
            disabled={!dependents.cascadeDeletable}
            onClick={() => {
              handleClose();
              handleDeleteClick(dataId, true);
            }}
            color='primary'
            autoFocus
          >
            Proceed Deletion
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openGroupDependencyList}
        onClose={() => setOpenGroupDependencyList(false)}
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
          <Typography variant='h6'>
            Dependents: [{groupDependencyTitle}]
          </Typography>
          <IconButton
            aria-label='close'
            onClick={() => setOpenGroupDependencyList(false)}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <DialogContentText id='alert-dialog-description'>
            <CustomMaterialTable
              rows={groupDependents}
              columns={[
                { label: 'Campaign Name', value: 'campaignName' },
                { label: 'Campaign ID', value: 'campaignId' },
              ]}
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => onHandleGroupCopyToClipboard()}
            color='primary'
          >
            Copy To Clipboard
          </Button>
        </DialogActions>
      </Dialog>
    </Wrapper>
  );
};

CampaignMainView.defaultProps = {
  // bla: 'test',
};
