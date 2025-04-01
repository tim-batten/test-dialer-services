/* eslint-disable no-empty-pattern */
import PubSub from 'pubsub-js';
import React, { useEffect, useState } from 'react';
import { ActionType } from 'react-awesome-query-builder';
import { AccessRoles } from '../../..';
import { config_baseURL } from '../../../api';
import { Title } from '../../CampaignView/CampaignConfigurator/CampaignConfigurator.Styles';
import { AccountSelector } from '../../commons/AccountSelector';
import { BottomSlidingPane } from '../../commons/BottomSlidingPane';
import { SnackbarComponent } from '../../commons/SnackbarComponent';
import { IAccounts, ICallBackMessage } from '../../commons/types/commonTypes';
import { CampaignOversightDetails } from '../CampaignOversightDetails';
import { CampaignOversightListTable } from './CampaignOversightListTable';
import {
  ButtonWrapper,
  TitleWrapper,
  Wrapper,
} from './CampaignOversightMainView.Styles';
import { ISchedule } from '../../commons/types/schedulerTypes';
import { IDialerDefaults } from '../../commons/types/globalTypes';
import { OversightStats } from 'lcme-common/lib/types/oversight-stats';
import { CampaignPacingDefinition } from 'lcme-common/lib/models/campaign';

interface ICampaignOversightMainView {
  scheduleExecutions: OversightStats[];
  didSucceed: boolean;
  accessLevel: any;
  schedules: ISchedule[];
  getSchedules: () => void;
  selectedAccount: IAccounts | undefined | 'All';
  setAccount: (account: IAccounts | undefined | 'All') => void;
  getScheduleExecutions: () => void;
  controlScheduleExecution: (
    action: string,
    scheduleExecutionId: string,
    callback: (info: any) => void,
    pacing?: Partial<CampaignPacingDefinition>,
  ) => void;
  dialerDefaults: IDialerDefaults;
  getDialerDefaults: () => void;
}

export const CampaignOversightMainView: React.FunctionComponent<
  ICampaignOversightMainView
> = ({
  scheduleExecutions,
  selectedAccount,
  setAccount,
  didSucceed,
  accessLevel,
  getScheduleExecutions,
  controlScheduleExecution,
  dialerDefaults: tempDialerDefaults,
  getDialerDefaults,
  schedules,
  getSchedules,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<OversightStats | null>(null);
  const [rowData, setRowData] = useState(scheduleExecutions);
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('success');
  const [dialerDefaults, setDialerDefaults] = useState<IDialerDefaults>(tempDialerDefaults);
  const [accountURL, setAccountURL] = useState<any>();

  useEffect(() => {
    if (Array.isArray(tempDialerDefaults)) {
      const temp = tempDialerDefaults.find(
        (tg) => tg.prjacc.url === config_baseURL(),
      );
      setDialerDefaults(temp);
    } else {
      setDialerDefaults(tempDialerDefaults);
    }
  }, [accountURL, tempDialerDefaults]);

  const handlePaneClose = () => {
    PubSub.publish('campaign_oversight_pane_status', false);
  };

  const handleOpenSnack = () => {
    setOpenSnack(true);
  };

  useEffect(() => {
    PubSub.subscribe(
      'control_schedule_execution',
      (topic, msg: ICallBackMessage) => {
        setSnackMessage(msg.message);
        setSeverity(msg.severity);
        setOpenSnack(true);
      },
    );

    return () => PubSub.unsubscribe('control_schedule_execution');
  }, []);

  useEffect(() => {
    PubSub.subscribe('campaign_oversight_form_status', (topic, msg) => {
      setOpen(!msg);
    });

    if (scheduleExecutions.length < 1) {
      getScheduleExecutions();
      if (rowData !== scheduleExecutions) {
        setRowData(scheduleExecutions);
      }
    }
  }, []);

  useEffect(() => {
    getScheduleExecutions();
    getDialerDefaults();
    const interval = setInterval(() => {
      getScheduleExecutions();
    }, 5000);
    return () => clearInterval(interval);
  }, [accountURL]);

  useEffect(() => {
    setRowData(scheduleExecutions);
  }, [scheduleExecutions]);

  const handleRowClick = (rowId: any) => {
    const scheduleExecution = scheduleExecutions?.find(
      (se) => se.scheduleExecutionId === rowId,
    );
    setSelectedRow(scheduleExecution || null);
    setTitle(scheduleExecution?.scheduleName || '');
    setOpen(true);
  };

  const handleDiscard = () => {
    setOpen(false);
    setSelectedRow(null);
    localStorage.setItem('onEditMode', '0');
  };

  const alertReadOnly = () => {
    setSnackMessage('Access Denied');
    setSeverity('info');
    setOpenSnack(true);
  };

  const handleCloseSnack = (_event?: React.SyntheticEvent, reason?: string) => {
    setOpenSnack(false);
  };

  const handleUpdateCallback = (data: any) => {
    const status = data.action.type;
    if (status === 'CONTROL_SCHEDULE_EXECUTION_FULFILLED') {
      setSnackMessage('Campaign Updated!');
      setSeverity('success');
    } else if (status === 'CONTROL_SCHEDULE_EXECUTION_REJECTED') {
      setSnackMessage('Campaign Update Failed!');
      setSeverity('error');
    }
    setOpenSnack(true);
  };

  return (
    <Wrapper>
      <TitleWrapper>
        <Title variant='h6'>Campaign Oversight</Title>
        <ButtonWrapper>
          <AccountSelector
            initialValue={selectedAccount}
            onValueChange={(data) => setAccount(data)}
            disabled={open}
          />
        </ButtonWrapper>
      </TitleWrapper>
      <BottomSlidingPane
        title={title}
        topOffSet={100}
        open={open}
        readonly={accessLevel === AccessRoles.READ_ONLY}
        onClose={() => handlePaneClose()}
        component={
          <CampaignOversightDetails
            dialerDefaults={dialerDefaults}
            schedules={schedules}
            onDiscardClick={() => handleDiscard()}
            selectedScheduleExecution={selectedRow!}
            controlScheduleExecution={(
              action: ActionType,
              scheduleExecutionId: string,
              callback: (info: any) => void,
              pacing?: Partial<CampaignPacingDefinition>,
            ) =>
              controlScheduleExecution(
                action,
                scheduleExecutionId,
                (data) => {
                  handleUpdateCallback(data);
                  callback(data);
                },
                pacing,
              )
            }
            onAccountChange={(url) => setAccountURL(url)}
          />
        }
      >
        <CampaignOversightListTable
          onRowClick={(row) => {
            if (accessLevel === AccessRoles.READ_ONLY) {
              alertReadOnly();
            } else {
              handleRowClick(row);
            }
          }}
          rowData={rowData}
          accessLevel={accessLevel}
          controlScheduleExecution={(
            action: ActionType,
            scheduleExecutionId: string,
            callback: (info: any) => void,
            pacing?: Partial<CampaignPacingDefinition>,
          ) =>
            controlScheduleExecution(
              action,
              scheduleExecutionId,
              (data) => {
                handleUpdateCallback(data);
                callback(data);
              },
              pacing,
            )
          }
          accountURL={accountURL}
        />
      </BottomSlidingPane>

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
    </Wrapper>
  );
};

CampaignOversightMainView.defaultProps = {
  // bla: 'test',
};
