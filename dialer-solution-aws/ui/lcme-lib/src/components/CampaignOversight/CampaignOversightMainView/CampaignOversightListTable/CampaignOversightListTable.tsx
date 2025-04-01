/* eslint-disable no-empty-pattern */
import {
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
} from '@material-ui/core';
import { SkipNextRounded } from '@material-ui/icons';
import FilterListIcon from '@material-ui/icons/FilterList';
import PauseRoundedIcon from '@material-ui/icons/PauseRounded';
import PlayArrowRoundedIcon from '@material-ui/icons/PlayArrowRounded';
import StopRoundedIcon from '@material-ui/icons/StopRounded';
import { OversightStats } from 'lcme-common/lib/types/oversight-stats';
import PubSub from 'pubsub-js';
import React, { useEffect, useState } from 'react';
import { AccessRoles, controlScheduleExecution } from '../../../..';
import ReactAGGrid from '../../../commons/ReactAGGrid';
import { ICallBackMessage } from '../../../commons/types/commonTypes';
import { ActionType } from '../../../commons/types/oversightTypes';
import { ButtonWrapper } from '../CampaignOversightMainView.Styles';
import {
  CustomTextField,
  GridWrapper,
  TitleWrapper,
  Wrapper
} from './CampaignOversightListTable.Styles';
import { OversightColumns } from './OversightColumns';
import { CampaignPacingDefinition } from 'lcme-common/lib/models/campaign';

interface ICampaignOversightListTable {
  onRowClick: (row: any) => void;
  rowData: OversightStats[];
  accessLevel: any;
  controlScheduleExecution?: (
    action: ActionType,
    scheduleExecutionId: string,
    callback: (info: any) => void,
    pacing?: Partial<CampaignPacingDefinition>,
  ) => void;
  accountURL: string;
}

type OversightRowData = OversightStats & { readOnly: boolean };

interface ICampaignOversightListTable {}

const FilterNames = [
  'Schedule Name',
  'Campaign Name',
  'Queue',
  'Status',
  'Campaign Mode',
  'Current Sequence',
] as const;
type FilterName = typeof FilterNames[number];

const columns = [...OversightColumns];

const mapReadOnly = (rowData: OversightStats[], accessLevel?: any): OversightRowData[] => {
  return rowData.map((rd) => ({
    ...rd,
    readOnly: accessLevel ? accessLevel === AccessRoles.READ_ONLY : false,
  }));
}

export const CampaignOversightListTable: React.FunctionComponent<
  ICampaignOversightListTable
> = ({ onRowClick, rowData, accessLevel, accountURL }) => {
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [filterName, setFilterName] = useState<FilterName>('Schedule Name');
  const [filterTarget, setFilterTarget] = useState<string>('');
  const [myData, setMyData] = useState<OversightRowData[]>(mapReadOnly(rowData));
  const [, updateState] = React.useState({});
  const forceUpdate = React.useCallback(() => updateState({}), []);

  useEffect(() => {
    // forceUpdate();
  }, [accountURL]);

  useEffect(() => {
    setMyData(mapReadOnly(rowData, accessLevel));
  }, [rowData]);

  const handleFilterMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchor(event.currentTarget);
  };
  const handleCloseFilter = () => {
    setFilterAnchor(null);
  };

  const handleExecution = (
    status: 'PAUSED' | 'RUNNING' | 'STOPPING' | 'SKIP_SEQUENCE',
    malfunctioned: boolean,
  ) => {
    const message: ICallBackMessage = {
      code: '',
      message: '',
      severity: 'success',
    };
    if (malfunctioned) {
      message.severity = 'error';
      switch (status) {
        case 'PAUSED':
          message.code = 'PAUSED';
          message.message = 'Pause Failed!';
          break;
        case 'RUNNING':
          message.code = 'RUNNING';
          message.message = 'Start Failed!';
          break;
        case 'STOPPING':
          message.code = 'STOPPING';
          message.message = 'Stop Failed!';
          break;
        case 'SKIP_SEQUENCE':
          message.code = 'SKIP_SEQUENCE';
          message.message = 'Skip Failed!';
          break;

        default:
          break;
      }
    } else {
      message.severity = 'success';
      switch (status) {
        case 'PAUSED':
          message.code = 'PAUSED';
          message.message = 'Pause Success!';
          break;
        case 'RUNNING':
          message.code = 'RUNNING';
          message.message = 'Start Success!';
          break;
        case 'STOPPING':
          message.code = 'STOPPING';
          message.message = 'Stop Success!';
          break;
        case 'SKIP_SEQUENCE':
          message.code = 'SKIP_SEQUENCE';
          message.message = 'Skip Success!';
          break;
        default:
          break;
      }
    }

    PubSub.publish('control_schedule_execution', message);
  };

  const eventFilter = (filterMode: FilterName) => {
    const lowerTarget = filterTarget.toLowerCase();
    switch (filterMode) {
      case 'Schedule Name':
        return myData?.filter((event) => {
          return event?.scheduleName?.toLowerCase().indexOf(lowerTarget) !== -1;
        });
      case 'Campaign Name':
        return myData?.filter((event) => {
          return (
            event?.campaignInfo?.campaignName?.toLowerCase().indexOf(
              lowerTarget,
            ) !== -1
          );
        });
      case 'Queue':
        return myData?.filter((event) => {
          return (
            event?.queueInfo?.queueName
              ?.toLowerCase()
              .indexOf(lowerTarget) !== -1
          );
        });
      case 'Status':
        return myData?.filter((event) => {
          return event?.status?.toLowerCase().indexOf(lowerTarget) !== -1;
        });
      case 'Campaign Mode':
        return myData?.filter((event) => {
          return event?.campaignMode?.toLowerCase().indexOf(lowerTarget) !== -1;
        });
      case 'Current Sequence':
        return myData?.filter((event) => {
          return (
            event?.progressInfo?.currentSequenceInfo?.currentSequenceName?.toLowerCase().indexOf(
              lowerTarget,
            ) !== -1
          );
        });

      default:
        return myData;
    }
  };

  return (
    <Wrapper>
      <TitleWrapper>
        <ButtonWrapper>
          <CustomTextField
            size='small'
            label={`Filter by ${filterName}`}
            placeholder={`Filter by ${filterName}`}
            variant='outlined'
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <Tooltip title='Change Filter Criteria' placement='top'>
                    <IconButton onClick={handleFilterMenu}>
                      <FilterListIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            onChange={(e) => setFilterTarget(e.target.value)}
          />
          <Menu
            id='filter-menu'
            open={Boolean(filterAnchor)}
            keepMounted
            anchorEl={filterAnchor}
            onClose={handleCloseFilter}
          >
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Schedule Name');
              }}
            >
              Schedule Name{' '}
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Campaign Name');
              }}
            >
              Campaign Name
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Queue');
              }}
            >
              Task Queue
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Status');
              }}
            >
              Status
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Campaign Mode');
              }}
            >
              Campaign Mode
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Current Sequence');
              }}
            >
              Current Sequence
            </MenuItem>
          </Menu>
        </ButtonWrapper>
      </TitleWrapper>
      <GridWrapper>
        <ReactAGGrid
          name='campaignOversight'
          onRowClicked={(event, rowData: OversightRowData) => {
            onRowClick(rowData?.scheduleExecutionId);
          }}
          actions={[
            {
              icon: () => <PlayArrowRoundedIcon />,
              tooltip: 'Resume',
              onClick: (event, rowData: OversightRowData) => {
                if (rowData?.readOnly === true) {
                  const message = {
                    severity: 'info',
                    message: 'Access Denied',
                  };
                  PubSub.publish('control_schedule_execution', message);
                } else if (rowData?.status === 'STOPPING') {
                  const message = {
                    severity: 'error',
                    message: 'Schedule Stop is Already in Progress',
                  };
                  PubSub.publish('control_schedule_execution', message);
                } else if (rowData?.status === 'RUNNING') {
                  const message = {
                    severity: 'info',
                    message: 'Schedule is Already Running',
                  };
                  PubSub.publish('control_schedule_execution', message);
                } else {
                  controlScheduleExecution(
                    'RESUME',
                    rowData?.scheduleExecutionId,
                  )
                    .then(() => {
                      handleExecution('RUNNING', false);
                    })
                    .catch(() => {
                      handleExecution('RUNNING', true);
                    });
                }
              },
            },
            {
              icon: () => <PauseRoundedIcon />,
              tooltip: 'Pause',
              onClick: (event, rowData: OversightRowData) => {
                if (rowData?.readOnly) {
                  const message = {
                    severity: 'info',
                    message: 'Access Denied',
                  };
                  PubSub.publish('control_schedule_execution', message);
                } else if (rowData?.status === 'STOPPING') {
                  const message = {
                    severity: 'error',
                    message: 'Schedule Stop is Already in Progress',
                  };
                  PubSub.publish('control_schedule_execution', message);
                } else if (rowData?.status === 'PAUSED') {
                  const message = {
                    severity: 'info',
                    message: 'Schedule is Already Paused',
                  };
                  PubSub.publish('control_schedule_execution', message);
                } else {
                  controlScheduleExecution(
                    'PAUSE',
                    rowData?.scheduleExecutionId,
                  )
                    .then((data) => {
                      handleExecution('PAUSED', false);
                    })
                    .catch((err) => {
                      console.log(err);

                      handleExecution('PAUSED', true);
                    });
                }
              },
            },
            {
              icon: () => <SkipNextRounded />,
              tooltip: 'Skip',
              onClick: (event, rowData: OversightRowData) => {
                if (rowData?.readOnly) {
                  const message = {
                    severity: 'info',
                    message: 'Access Denied',
                  };
                  PubSub.publish('control_schedule_execution', message);
                } else if (rowData?.status === 'STOPPING') {
                  const message = {
                    severity: 'error',
                    message: 'Schedule Stop is Already in Progress',
                  };
                  PubSub.publish('control_schedule_execution', message);
                } else if (
                  (rowData?.status === 'RUNNING' ||
                    rowData?.status === 'PAUSED') &&
                  (rowData?.progressInfo?.scheduleProgress?.currentSequence ||
                    0) >=
                    (rowData?.progressInfo?.scheduleProgress?.totalSequences ||
                      0)
                ) {
                  const message = {
                    severity: 'info',
                    message: 'Cannot Skip Current Sequence',
                  };
                  PubSub.publish('control_schedule_execution', message);
                } else {
                  controlScheduleExecution(
                    'SKIP_SEQUENCE',
                    rowData?.scheduleExecutionId,
                  )
                    .then(() => {
                      handleExecution('SKIP_SEQUENCE', false);
                    })
                    .catch(() => {
                      handleExecution('SKIP_SEQUENCE', true);
                    });
                }
              },
            },
            {
              icon: () => <StopRoundedIcon />,
              tooltip: 'Stop',
              onClick: (event, rowData: OversightRowData) => {
                if (rowData?.readOnly) {
                  const message = {
                    severity: 'info',
                    message: 'Access Denied',
                  };
                  PubSub.publish('control_schedule_execution', message);
                } else if (rowData?.status === 'STOPPING') {
                  const message = {
                    severity: 'info',
                    message: 'Schedule Stop is Already in Progress',
                  };
                  PubSub.publish('control_schedule_execution', message);
                } else {
                  controlScheduleExecution('STOP', rowData?.scheduleExecutionId)
                    .then(() => {
                      handleExecution('STOPPING', false);
                    })
                    .catch(() => {
                      handleExecution('STOPPING', true);
                    });
                }
              },
            },
          ]}
          columns={OversightColumns}
          rows={eventFilter(filterName)}
          autoResize
        />
      </GridWrapper>
    </Wrapper>
  );
};

CampaignOversightListTable.defaultProps = {
  // bla: 'test',
};