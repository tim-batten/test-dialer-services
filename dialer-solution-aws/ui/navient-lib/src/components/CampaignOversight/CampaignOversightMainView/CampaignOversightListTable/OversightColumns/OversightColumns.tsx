/* eslint-disable no-empty-pattern */
import { MuiThemeProvider, Tooltip, createTheme } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import LinearProgress from '@material-ui/core/LinearProgress';
import { ColDef } from 'ag-grid-community';
import { OversightStats } from 'navient-common/lib/types/oversight-stats';
import React from 'react';
import { isBaseURLAll } from '../../../../../api';
import {
  BoxWrapper,
  MultilineText,
  ProgressWrapper
} from './OversightColumns.Styles';
import { isNumber } from 'lodash';

type RowData<T> = {
  data: T;
};

type OversightStatsRowData = RowData<OversightStats>;

type OversightCellRendererType = (
  params: OversightStatsRowData,
) => JSX.Element | string | Date | number | null | undefined;

type OversightColDef = ColDef &
  (
    | {
        field: keyof OversightStats | 'prjacc.name';
        headerName: string;
        width: number;
        cellRenderer?: OversightCellRendererType;
      }
    | {
        field: string;
        headerName: string;
        width: number;
        cellRenderer: OversightCellRendererType;
      }
  );

const theme = createTheme({
  palette: {
    primary: {
      main: '#2ECC40',
    },
    secondary: {
      main: '#FF4136',
    },
    success: {
      main: '#2ECC40',
    },
    error: {
      main: '#FF4136',
    },
  },
  overrides: {
    MuiTooltip: {
      tooltip: {
        fontSize: '1.1em',
      },
    },
  },
});

export const OversightColumns: OversightColDef[] = [
  {
    headerName: 'Account Name',
    field: 'prjacc.name',
    hide: !isBaseURLAll(),
    width: 200,
  },
  {
    field: 'status',
    headerName: 'Status',
    headerTooltip: 'Campaign Status (can be RUNNING, PAUSED, or STOPPING)',
    width: 175,
  },
  {
    field: 'scheduleId',
    headerName: 'Schedule ID',
    width: 175,
    hide: true,
  },
  {
    field: 'campaignId',
    headerName: 'Campaign ID',
    headerTooltip: 'Dialer Campaign ID',
    width: 175,
    hide: true,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) =>
      rowData?.campaignInfo?.campaignId
        ? rowData?.campaignInfo?.campaignId
        : 'Unavailable',
  },
  {
    field: 'scheduleExecutionId',
    headerName: 'Schedule Execution ID',
    hide: true,
    width: 250,
  },
  {
    field: 'campaignExecutionId',
    headerName: 'Campaign Execution ID',
    headerTooltip:
      'Campaign Execution ID - A campaign execution is a sequence within a schedule',
    hide: true,
    width: 250,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) =>
      rowData?.progressInfo?.currentSequenceInfo?.currentCampaignExecutionId ||
      'None',
  },
  {
    field: 'startTime',
    headerName: 'Start Time (UTC)',
    hide: true,
    width: 250,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      return rowData?.startTime;
    },
  },
  {
    field: 'lastContactEvent',
    headerName: 'Last Contact Event',
    hide: true,
    width: 250,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      return rowData?.campaignStats?.lastContactEvent || 'No Events Received';
    },
  },
  {
    field: 'endTime',
    headerName: 'End Time (UTC)',
    hide: true,
    width: 250,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      return rowData?.endTime;
    },
  },
  {
    field: 'scheduleName',
    headerName: 'Schedule Name',
    // pinned: 'left',
    width: 175,
  },
  {
    field: 'campaignName',
    headerName: 'Campaign Name',
    hide: true,
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) =>
      rowData?.campaignInfo?.campaignName
        ? rowData?.campaignInfo?.campaignName
        : 'Unavailable',
  },
  {
    field: 'campaignWeight',
    headerName: 'Campaign Mode',
    headerTooltip: 'Campaign Mode (can be AGENTLESS or POWER)',
    hide: true,
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const mode = rowData?.campaignMode?.toUpperCase();
      return mode != null ? mode : 'Unavailable';
    },
  },
  {
    field: 'cumulative_contacts',
    headerName: 'Total Campaign Calls',
    headerTooltip: 'Total Calls on Campaign since last stats reset',
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const totalCalls =
        rowData?.campaignStats.campaign?.historicalStats?.initiated;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{totalCalls || 'N/A'}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'recordsDialedProgress',
    headerName: 'Seq. Records Info',
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const sequenceProgress = rowData?.progressInfo?.sequenceProgress;
      let recordsString;

      if (
        sequenceProgress &&
        sequenceProgress?.recordsAttempted != null &&
        sequenceProgress?.recordsToDial != null
      )
        recordsString = `${sequenceProgress?.recordsAttempted} of ${sequenceProgress?.recordsToDial} Attempted`;
      else if (sequenceProgress && sequenceProgress?.recordsAttempted != null)
        recordsString = `${sequenceProgress?.recordsAttempted} Attempted`;
      else recordsString = 'Not Available';

      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{recordsString}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'totalSequencesRemaining',
    headerName: 'Sequences Remaining (Total)',
    hide: true,
    width: 225,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const progress = rowData?.progressInfo?.scheduleProgress;
      const progressCalculation =
        (progress?.totalSequences || 0) - (progress?.currentSequence || 0);

      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{progressCalculation !== 0 ? progressCalculation : 'N/A'}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'totalSequenceProgress',
    headerName: 'Sequence Progress (Total)',
    width: 375,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const progress = rowData?.progressInfo?.scheduleProgress;
      const progressCalculation =
        ((progress?.currentSequence || 0) / (progress?.totalSequences || 1)) *
        100;

      return (
        <BoxWrapper>
          <Box width={7 / 10}>
            <ProgressWrapper>
              <MuiThemeProvider theme={theme}>
                <Tooltip title={rowData?.scheduleName} placement='top'>
                  <LinearProgress
                    variant='determinate'
                    value={progressCalculation}
                    color={progressCalculation > 50 ? 'primary' : 'secondary'}
                  />
                </Tooltip>
              </MuiThemeProvider>
            </ProgressWrapper>
          </Box>
          <Box width={3 / 10} style={{ marginLeft: '1.5em' }}>
            <b>
              {progress?.currentSequence} / {progress?.totalSequences}
            </b>
          </Box>
        </BoxWrapper>
      );
    },
  },
  {
    field: 'currentSequenceName',
    headerName: 'Current Sequence',
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const currentSeq =
        rowData?.progressInfo?.currentSequenceInfo?.currentSequenceName;
      return currentSeq ? currentSeq : 'Unavailable';
    },
  },
  {
    field: 'activePhoneTypes',
    headerName: 'Active Phone Types',
    hide: true,
    width: 250,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const activePhones =
        rowData?.progressInfo?.currentSequenceInfo?.activePhoneTypes?.toString();
      return (
        <MultilineText>
          {activePhones != null ? activePhones : 'Unavailable'}
        </MultilineText>
      );
    },
  },
  {
    field: 'activeFilters',
    headerName: 'Active Filters',
    hide: true,
    width: 300,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const filters = rowData?.progressInfo?.currentSequenceInfo?.filters
        ?.map((f, i, arr) => {
          if (i === 0) return f.name;
          else if (i + 1 <= arr.length) return ` ${f.name}`;
          else return '';
        })
        ?.toString();

      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <MultilineText>
              {filters != null ? filters : 'Unavailable'}
            </MultilineText>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'currentSequenceProgress',
    headerName: 'Sequence Progress (Loop)',
    hide: true,
    width: 375,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const progress = rowData?.progressInfo?.scheduleProgress;
      const progressCalculation =
        ((progress?.currentSequenceIndex || 0) /
          (progress?.numSequences || 1)) *
        100;

      return (
        <BoxWrapper>
          <Box width={7 / 10}>
            <ProgressWrapper>
              <MuiThemeProvider theme={theme}>
                <Tooltip title={rowData?.scheduleName} placement='top'>
                  <LinearProgress
                    variant='determinate'
                    value={progressCalculation}
                    color={progressCalculation > 50 ? 'primary' : 'secondary'}
                  />
                </Tooltip>
              </MuiThemeProvider>
            </ProgressWrapper>
          </Box>
          <Box width={3 / 10} style={{ marginLeft: '1.5em' }}>
            <b>
              {progress?.currentSequenceIndex} / {progress?.numSequences}
            </b>
          </Box>
        </BoxWrapper>
      );
    },
  },
  {
    field: 'totalLoopProgress',
    headerName: 'Loop Progress',
    hide: true,
    width: 375,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const progress = rowData?.progressInfo?.scheduleProgress;
      const progressCalculation =
        ((progress?.currentLoop || 0) / (progress?.numLoops || 1)) * 100;

      return (
        <BoxWrapper>
          <Box width={7 / 10}>
            <ProgressWrapper>
              <MuiThemeProvider theme={theme}>
                <Tooltip title={rowData?.scheduleName} placement='top'>
                  <LinearProgress
                    variant='determinate'
                    value={progressCalculation}
                    color={progressCalculation > 50 ? 'primary' : 'secondary'}
                  />
                </Tooltip>
              </MuiThemeProvider>
            </ProgressWrapper>
          </Box>
          <Box width={3 / 10} style={{ marginLeft: '1.5em' }}>
            <b>
              {progress?.currentLoop} / {progress?.numLoops}
            </b>
          </Box>
        </BoxWrapper>
      );
    },
  },
  {
    field: 'loopsRemaining',
    headerName: 'Loops Remaining',
    hide: true,
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const progress = rowData?.progressInfo?.scheduleProgress;
      const progressCalculation =
        (progress?.numLoops || 0) - (progress?.currentLoop || 0);

      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{progressCalculation !== 0 ? progressCalculation : 'N/A'}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'in_flight_contacts',
    headerName: 'In-Flight Contacts',
    width: 200,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const inFlightContacts =
        rowData?.campaignStats?.campaignExecution?.historicalStats?.in_flight;
      const fieldVal = isNumber(inFlightContacts)
        ? inFlightContacts
        : 'Unavailable';
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{fieldVal}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'active_contacts',
    headerName: 'Active Contacts',
    width: 200,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const activeContacts =
        rowData?.campaignStats?.campaignExecution?.historicalStats?.active;
      const fieldVal = isNumber(activeContacts)
        ? activeContacts
        : 'Unavailable';
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{fieldVal}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'availableWorkers',
    headerName: 'Available Workers',
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const stats = rowData?.campaignStats?.current;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{stats?.availableAgents}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'unavailableWorkers',
    headerName: 'Unavailable Workers',
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const stats = rowData?.campaignStats?.current;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{stats?.nonProductiveAgents}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  // {
  //   field: 'unavailableWorkers',
  //   headerName: 'Unavailable Workers',
  //   width: 175,
  //   cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
  //     const stats = rowData?.queueStats;
  //     const unavailableWorkers = stats?.unavailableWorkers;
  //     const breakWorkers = stats?.breakWorkers;
  //     const totalUnavailableWorkers = unavailableWorkers + breakWorkers;

  //     return (
  //       <MuiThemeProvider theme={theme}>
  //         <Tooltip title={rowData?.scheduleName} placement='top'>
  //           <div>
  //             {totalUnavailableWorkers != null
  //               ? totalUnavailableWorkers
  //               : 'Unavailable'}
  //           </div>
  //         </Tooltip>
  //       </MuiThemeProvider>
  //     );
  //   },
  // },
  // {
  //   field: 'offlineWorkers',
  //   headerName: 'Offline Workers',
  //   hide: true,
  //   width: 175,
  //   cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
  //     const stats = rowData?.queueStats;
  //     return (
  //       <MuiThemeProvider theme={theme}>
  //         <Tooltip title={rowData?.scheduleName} placement='top'>
  //           <div>{stats?.offlineWorkers}</div>
  //         </Tooltip>
  //       </MuiThemeProvider>
  //     );
  //   },
  // },
  {
    field: 'abaTargetRate',
    headerName: 'ABA Target Rate',
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const pacing = rowData?.pacing;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>
              {pacing?.AbaTargetRate != null
                ? `${pacing?.AbaTargetRate.toFixed(2)} %`
                : 'N/A'}
            </div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'lastAbandonRate',
    headerName: 'Last Abandon Rate',
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const lastAbandonRate = (
        (rowData?.progressInfo?.sequenceProgress?.lastAbandonRate || 0) * 100
      ).toFixed(2);

      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>
              {lastAbandonRate != null ? `${lastAbandonRate} %` : 'N/A'}
            </div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'AbandonRate_Calls',
    headerName: 'Abandon Rate Calls (Cumulative)',
    width: 225,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const abaRate =
        rowData?.campaignStats?.campaign?.abandonRates?.calls || null;
      const abaRatePercent = abaRate ? (abaRate * 100).toFixed(2) : null;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{abaRatePercent != null ? `${abaRatePercent} %` : 'N/A'}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'AbandonRate_Detects',
    headerName: 'Abandon Rate Detects (Cumulative)',
    width: 225,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const abaRate =
        rowData?.campaignStats?.campaign?.abandonRates?.detects || null;
      const abaRatePercent = abaRate ? (abaRate * 100).toFixed(2) : null;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{abaRatePercent != null ? `${abaRatePercent} %` : 'N/A'}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'AbandonRate_Connects',
    headerName: 'Abandon Rate Connects (Cumulative)',
    width: 225,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const abaRate =
        rowData?.campaignStats?.campaign?.abandonRates?.connects || null;
      const abaRatePercent = abaRate ? (abaRate * 100).toFixed(2) : null;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{abaRatePercent != null ? `${abaRatePercent} %` : 'N/A'}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'abandoned_in_queue',
    headerName: 'Abandoned in Queue (Cumulative)',
    width: 225,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const stats =
        rowData?.campaignStats?.campaign?.historicalStats?.abandoned_queue;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{stats}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'queued',
    headerName: 'Queued (Cumulative)',
    width: 225,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const stats = rowData?.campaignStats?.campaign?.historicalStats?.queued;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{stats}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'ABA Calculation',
    headerName: 'ABA Calculation',
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const pacing = rowData?.pacing;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{pacing?.AbaCalculation}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'InitialCpa',
    headerName: 'Initial CPA',
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const pacing = rowData?.pacing;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{pacing?.InitialCPA}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'InitialCPAMode',
    headerName: 'Initial CPA Mode',
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const pacing = rowData?.pacing;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{pacing?.InitialCPAMode}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'InitialDuration',
    headerName: 'Initial Pacing',
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const pacing = rowData?.pacing;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{pacing?.InitialDuration}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'AbaIncrement',
    headerName: 'ABA Increment',
    hide: true,
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const pacing = rowData?.pacing;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>
              {pacing?.AbaIncrement != null
                ? `${pacing?.AbaIncrement.toFixed(2)} %`
                : 'N/A'}
            </div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'CpaModifier',
    headerName: 'CPA Modifier',
    hide: true,
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const pacing = rowData?.pacing;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>
              {pacing?.CpaModifier != null
                ? `${pacing?.CpaModifier.toFixed(2)} %`
                : 'N/A'}
            </div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'ConcurrentCalls',
    headerName: 'Max Concurrent Calls',
    hide: true,
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const mode = rowData?.campaignMode?.toUpperCase();
      const pacing = rowData?.pacing;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{mode === 'AGENTLESS' ? pacing?.ConcurrentCalls : 'N/A'}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'Weight',
    headerName: 'Campaign Priority',
    hide: true,
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{rowData?.campaignWeight}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'connected_to_agent',
    headerName: 'Connected to Agent (Active)',
    hide: true,
    width: 230,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const stats =
        rowData?.campaignStats?.campaign?.historicalStats?.connected_to_agent;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{stats}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  {
    field: 'connects_to_agents',
    headerName: 'Connected to Agent (Cumulative)',
    hide: true,
    width: 230,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const stats =
        rowData?.campaignStats?.campaign?.historicalStats?.connects_to_agents;
      return (
        <MuiThemeProvider theme={theme}>
          <Tooltip title={rowData?.scheduleName} placement='top'>
            <div>{stats}</div>
          </Tooltip>
        </MuiThemeProvider>
      );
    },
  },
  // {
  //   field: 'TasksReservedRealTime',
  //   headerName: 'Tasks Reserved',
  //   hide: true,
  //   width: 175,
  //   cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
  //     const tasksByStatus = rowData?.queueStats?.tasks_by_status;
  //     const tasksReserved =
  //       tasksByStatus?.reserved != null
  //         ? tasksByStatus?.reserved
  //         : 'Unavailable';

  //     return (
  //       <MuiThemeProvider theme={theme}>
  //         <Tooltip title={rowData?.scheduleName} placement='top'>
  //           <div>{tasksByStatus !== {} ? tasksReserved : 'Unavailable'}</div>
  //         </Tooltip>
  //       </MuiThemeProvider>
  //     );
  //   },
  // },
  // {
  //   field: 'TasksCompletedRealTime',
  //   headerName: 'Tasks Completed',
  //   hide: true,
  //   width: 175,
  //   cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
  //     const tasksByStatus = rowData?.queueStats?.tasks_by_status;
  //     const tasksCompleted =
  //       tasksByStatus?.completed != null
  //         ? tasksByStatus?.completed
  //         : 'Unavailable';

  //     return (
  //       <MuiThemeProvider theme={theme}>
  //         <Tooltip title={rowData?.scheduleName} placement='top'>
  //           <div>{tasksByStatus !== {} ? tasksCompleted : 'Unavailable'}</div>
  //         </Tooltip>
  //       </MuiThemeProvider>
  //     );
  //   },
  // },
  // {
  //   field: 'TasksWrappingRealTime',
  //   headerName: 'Tasks Wrapping',
  //   hide: true,
  //   width: 175,
  //   cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
  //     const tasksByStatus = rowData?.queueStats?.tasks_by_status;
  //     const tasksWrapping =
  //       tasksByStatus?.wrapping != null
  //         ? tasksByStatus?.wrapping
  //         : 'Unavailable';

  //     return (
  //       <MuiThemeProvider theme={theme}>
  //         <Tooltip title={rowData?.scheduleName} placement='top'>
  //           <div>{tasksByStatus !== {} ? tasksWrapping : 'Unavailable'}</div>
  //         </Tooltip>
  //       </MuiThemeProvider>
  //     );
  //   },
  // },
  // {
  //   field: 'TasksAssignedRealTime',
  //   headerName: 'Tasks Assigned',
  //   hide: true,
  //   width: 175,
  //   cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
  //     const tasksByStatus = rowData?.queueStats?.tasks_by_status;
  //     const tasksAssigned =
  //       tasksByStatus?.assigned != null
  //         ? tasksByStatus?.assigned
  //         : 'Unavailable';

  //     return (
  //       <MuiThemeProvider theme={theme}>
  //         <Tooltip title={rowData?.scheduleName} placement='top'>
  //           <div>{tasksByStatus !== {} ? tasksAssigned : 'Unavailable'}</div>
  //         </Tooltip>
  //       </MuiThemeProvider>
  //     );
  //   },
  // },
  // {
  //   field: 'TasksCanceledRealTime',
  //   headerName: 'Tasks Canceled',
  //   hide: true,
  //   width: 175,
  //   cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
  //     const tasksByStatus = rowData?.queueStats?.tasks_by_status;
  //     const tasksCanceled =
  //       tasksByStatus?.canceled != null
  //         ? tasksByStatus?.canceled
  //         : 'Unavailable';

  //     return (
  //       <MuiThemeProvider theme={theme}>
  //         <Tooltip title={rowData?.scheduleName} placement='top'>
  //           <div>{tasksByStatus !== {} ? tasksCanceled : 'Unavailable'}</div>
  //         </Tooltip>
  //       </MuiThemeProvider>
  //     );
  //   },
  // },
  // {
  //   field: 'TasksPendingRealTime',
  //   headerName: 'Tasks Pending',
  //   hide: true,
  //   width: 175,
  //   cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
  //     const tasksByStatus = rowData?.queueStats?.tasks_by_status;
  //     const tasksPending =
  //       tasksByStatus?.pending != null ? tasksByStatus?.pending : 'Unavailable';

  //     return (
  //       <MuiThemeProvider theme={theme}>
  //         <Tooltip title={rowData?.scheduleName} placement='top'>
  //           <div>{tasksByStatus !== {} ? tasksPending : 'Unavailable'}</div>
  //         </Tooltip>
  //       </MuiThemeProvider>
  //     );
  //   },
  // },
  {
    field: 'queue',
    headerName: 'Queue',
    hide: true,
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const { queueName, queueId } = rowData?.queueInfo || {};
      const queue = queueName ? `${queueName} (${queueId})` : queueId;
      return <div>{queue}</div>;
    },
  },
  {
    field: 'contact_flow',
    headerName: 'Contact Flow',
    width: 350,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) =>
      rowData?.campaignInfo?.contactFlowId
        ? rowData?.campaignInfo?.contactFlowId
        : 'Unavailable',
    hide: true,
  },
  {
    field: 'last_cpa',
    headerName: 'Last CPA',
    width: 175,
    cellRenderer: ({ data: rowData }: OversightStatsRowData) => {
      const lastCPA = rowData?.progressInfo?.sequenceProgress?.lastCPA;
      return lastCPA;
    },
  },
];