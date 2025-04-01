/* eslint-disable no-unused-vars */
import {
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
} from '@material-ui/core';
import { Column } from '@material-table/core';
import FilterListIcon from '@material-ui/icons/FilterList';
import DeleteOutlineOutlinedIcon from '@material-ui/icons/DeleteOutlineOutlined';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import FindReplaceOutlinedIcon from '@material-ui/icons/FindReplaceOutlined';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React, { useState } from 'react';
import { ReactMaterialTable } from '../../../commons/ReactMaterialTable';
import { ButtonWrapper } from '../CampaignMainView.Styles';
import {
  CustomTextField,
  GridWrapper,
  ListItemWrapper,
  TitleWrapper,
  Wrapper,
  CellWrapper,
  MultilineText,
  TableWrapper,
} from './CampaignListTable.Styles';
import { Visibility } from '@material-ui/icons';
import { isBaseURLAll } from '../../../../api/utils';
import ReactAGGrid from '../../../commons/ReactAGGrid';
import { ColDef } from 'ag-grid-community';
import { ICampaign } from '../../../commons/types/campaignTypes';

interface ICampaignListTable {
  onRowDoubleClick: Function;
  viewRow: Function;
  deleteRow: (id: any) => void;
  rowData: ICampaign[];
  openSidebar: boolean;
  campaigns: ICampaign[];
}

export const CampaignListTable: React.FunctionComponent<ICampaignListTable> = ({
  onRowDoubleClick,
  viewRow,
  deleteRow,
  rowData,
  openSidebar,
}) => {
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [filterName, setFilterName] = useState<string>('Campaign Name');
  const [filterTarget, setFilterTarget] = useState<string>('');

  const handleFilterMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchor(event.currentTarget);
  };
  const handleCloseFilter = () => {
    setFilterAnchor(null);
  };

  const eventFilter = (filterMode) => {
    const lowerTarget = filterTarget.toLowerCase();
    switch (filterMode) {
      case 'Campaign Name':
        return rowData?.filter((event: any) => {
          return event?.CampaignName?.toLowerCase().indexOf(lowerTarget) !== -1;
        });
      case 'Task Queue':
        return rowData?.filter((event: any) => {
          return (
            event?.BaseConfig?.TaskQueue?.toLowerCase().indexOf(lowerTarget) !==
            -1
          );
        });

      default:
        return rowData;
    }
  };

  const columns: {
    headerName: string;
    field: string;
    hide?: boolean;
    width: number;
    cellRenderer?: ({ data }: { data: ICampaign }) => any;
  }[] = [
    {
      headerName: 'Account Name',
      field: 'prjacc.name',
      hide: !isBaseURLAll(),
      width: 200,
    },
    {
      field: 'CampaignName',
      headerName: 'Campaign Name',
      width: 200,
    },
    {
      field: 'BaseConfig.CallingMode',
      headerName: 'Calling Mode',
      width: 200,
    },
    {
      field: 'BaseConfig.CampaignGroupId',
      headerName: 'Group ID',
      hide: true,
      width: 225,
    },
    {
      field: 'BaseConfig.TaskQueue',
      headerName: 'TaskQueue',
      width: 350,
    },
    {
      field: 'BaseConfig.ContactListConfigID',
      headerName: 'Contact List ID',
      width: 200,
    },
    {
      field: 'BaseConfig.Callerid',
      headerName: 'Default Caller ID',
      width: 200,
    },
    {
      field: 'BaseConfig.ContactFlowOverride',
      headerName: 'Contact Flow Override',
      width: 350,
      cellRenderer: ({ data: rowData }) =>
        rowData?.BaseConfig?.ContactFlowOverride?.length
          ? rowData.BaseConfig.ContactFlowOverride
          : 'None',
    },
    {
      field: 'BaseConfig.Weight',
      headerName: 'Campaign Priority',
      width: 200,
      cellRenderer: ({ data: rowData }) =>
        typeof rowData?.BaseConfig?.Weight === 'number'
          ? rowData?.BaseConfig?.Weight
          : 'None',
    },
    {
      field: 'BaseConfig.ActivePhoneTypes',
      headerName: 'Active Phone Types',
      width: 250,
      cellRenderer: ({ data: rowData }) => {
        const outputString =
          rowData?.BaseConfig?.ActivePhoneTypes?.toString().replaceAll(
            ',',
            ', ',
          );
        return outputString != null ? outputString : 'None';
      },
    },
    {
      field: 'Pacing.InitialCPAMode',
      headerName: 'Initial CPA Mode',
      width: 200,
    },
    {
      field: 'Pacing.InitialCPA',
      headerName: 'Initial CPA',
      width: 200,
    },
    {
      field: 'Pacing.MaxCPA',
      headerName: 'Max CPA',
      width: 200,
    },
    {
      field: 'Pacing.InitialCPAMode',
      headerName: 'Initial CPA Mode',
      width: 250,
    },
    {
      field: 'Pacing.InitialDuration',
      headerName: 'Initial Duration',
      width: 200,
    },
    {
      field: 'Pacing.AbaIncrement',
      headerName: 'ABA Increment',
      width: 200,
      cellRenderer: ({ data: rowData }) => {
        return rowData?.Pacing?.AbaIncrement + ' %';
      },
    },
    {
      field: 'Pacing.CpaModifier',
      headerName: 'CPA Modifier',
      width: 200,
      cellRenderer: ({ data: rowData }) => {
        return rowData?.Pacing?.CpaModifier + ' %';
      },
    },
    {
      field: 'Pacing.AbaTargetRate',
      headerName: 'ABA Target Rate',
      width: 200,
      cellRenderer: ({ data: rowData }) => {
        return rowData?.Pacing?.AbaTargetRate + ' %';
      },
    },
    {
      field: 'Pacing.AbaCalculation',
      headerName: 'ABA Calculation',
      width: 200,
    },
    {
      field: 'Pacing.ConcurrentCalls',
      headerName: 'Max Concurrent Calls',
      width: 200,
    },
    {
      field: 'CustomAttributes.ActiveAttributes',
      headerName: 'Custom Attributes',
      width: 250,
      cellRenderer: ({ data: rowData }) => {
        const attrs = rowData?.CustomAttributes?.ActiveAttributes?.map(
          (attr) => attr?.Value,
        );
        let outputString;
        attrs?.forEach((attr, index) => {
          if (attr && attr !== undefined && index > 0) {
            outputString += `, ${attr}`;
          } else if (attr && attr !== undefined) {
            outputString = attr;
          } else {
            outputString;
          }
        });

        return outputString != null ? outputString : 'None';
      },
    },
  ];

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
                setFilterName('Campaign Name');
              }}
            >
              Campaign Name{' '}
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Task Queue');
              }}
            >
              Task Queue
            </MenuItem>
          </Menu>
        </ButtonWrapper>
      </TitleWrapper>
      <GridWrapper>
        <ReactAGGrid
          name='campaign'
          onRowClicked={(e) => {}}
          actions={[
            {
              icon: () => <EditOutlinedIcon />,
              tooltip: 'Edit',
              disabled: openSidebar,
              onClick: (event, rowData) => {
                onRowDoubleClick(rowData, true);
              },
            },
            {
              icon: () => <FindReplaceOutlinedIcon />,
              tooltip: 'Copy',
              disabled: openSidebar,
              onClick: (event, rowData) => {
                onRowDoubleClick(rowData, false);
              },
            },
            {
              icon: () => <Visibility />,
              tooltip: 'View',
              disabled: openSidebar,
              onClick: (event, rowData) => {
                viewRow(rowData);
              },
            },
            {
              icon: () => <DeleteOutlineOutlinedIcon />,
              tooltip: 'Delete',
              disabled: openSidebar,
              onClick: (event, rowData) => {
                deleteRow(rowData.id);
              },
            },
          ]}
          columns={columns}
          rows={eventFilter(filterName)}
          autoResize
        />
      </GridWrapper>
    </Wrapper>
  );
};

CampaignListTable.defaultProps = {
  // bla: 'test',
};
