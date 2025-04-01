/* eslint-disable no-unused-vars */
import {
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
} from '@material-ui/core';
import { Visibility } from '@material-ui/icons';
import DeleteOutlineOutlinedIcon from '@material-ui/icons/DeleteOutlineOutlined';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import FilterListIcon from '@material-ui/icons/FilterList';
import FindReplaceOutlinedIcon from '@material-ui/icons/FindReplaceOutlined';
import { Column } from '@material-table/core';
import React, { useState } from 'react';
import { ReactMaterialTable } from '../../../commons/ReactMaterialTable';
import { ButtonWrapper } from '../ContactListMainView.Styles';
import {
  CustomTextField,
  GridWrapper,
  ListItemWrapper,
  TitleWrapper,
  Wrapper,
} from './ContactListTable.Styles';
import { isBaseURLAll } from '../../../../api/utils';
import ReactAGGrid from '../../../commons/ReactAGGrid';
import { ColDef } from 'ag-grid-community';

interface IContactListTable {
  onRowDoubleClick: Function;
  deleteRow: (id: any) => void;
  viewRow: Function;
  rowData: any;
  openSidebar: boolean;
  contactLists?: any;
}

interface IEditButtons {
  onEditClick: () => void;
  onCopyClick: () => void;
  onViewClick: () => void;
  onDeleteClick: Function;
  openSidebar: boolean;
}

const EditButtons: React.FunctionComponent<IEditButtons> = ({
  onEditClick,
  onCopyClick,
  onViewClick,
  onDeleteClick,
  openSidebar,
}) => {
  return (
    <ListItemWrapper>
      <div style={{ cursor: 'pointer' }}>
        <Tooltip title='Edit' placement='top'>
          <IconButton
            disabled={openSidebar}
            onClick={() => {
              onEditClick();
            }}
          >
            <EditOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='Copy' placement='top'>
          <IconButton
            disabled={openSidebar}
            onClick={() => {
              onCopyClick();
            }}
          >
            <FindReplaceOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='View' placement='top'>
          <IconButton
            disabled={openSidebar}
            onClick={() => {
              onViewClick();
            }}
          >
            <Visibility />
          </IconButton>
        </Tooltip>
        <Tooltip title='Delete' placement='top'>
          <IconButton
            disabled={openSidebar}
            onClick={() => {
              onDeleteClick();
            }}
          >
            <DeleteOutlineOutlinedIcon />
          </IconButton>
        </Tooltip>
      </div>
    </ListItemWrapper>
  );
};

export const ContactListTable: React.FunctionComponent<IContactListTable> = ({
  onRowDoubleClick,
  deleteRow,
  viewRow,
  rowData,
  openSidebar,
}) => {
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [filterName, setFilterName] = useState<string>('Contact List Name');
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
      case 'Contact List Name':
        return rowData?.filter((event: any) => {
          return (
            event?.ContactListConfigName?.toLowerCase().indexOf(lowerTarget) !==
            -1
          );
        });
      case 'Contact List Table':
        return rowData?.filter((event: any) => {
          return (
            event?.ContactListTable?.toLowerCase().indexOf(lowerTarget) !== -1
          );
        });
      case 'Phone List Table':
        return rowData?.filter((event: any) => {
          return (
            event?.PhoneListTable?.toLowerCase().indexOf(lowerTarget) !== -1
          );
        });
      case 'DNC Table':
        return rowData?.filter((event: any) => {
          return event?.DncTable?.toLowerCase().indexOf(lowerTarget) !== -1;
        });
      case 'DNC Identifier':
        return rowData?.filter((event: any) => {
          return (
            event?.DncIdentifier?.toLowerCase().indexOf(lowerTarget) !== -1
          );
        });
      case 'Daily Call Limit (Record)':
        return rowData?.filter((event: any) => {
          return (
            event?.Compliance?.DailyCallLimitRecord?.toString()
              .toLowerCase()
              .indexOf(lowerTarget) !== -1
          );
        });
      case 'Daily Call Limit (Phone)':
        return rowData?.filter((event: any) => {
          return (
            event?.Compliance?.DailyCallLimitPhone?.toString()
              .toLowerCase()
              .indexOf(lowerTarget) !== -1
          );
        });

      default:
        return rowData;
    }
  };

  const columns: ColDef[] = [
    {
      headerName: 'Account Name',
      field: 'prjacc.name',
      hide: !isBaseURLAll(),
      width: 200,
    },
    {
      field: 'id',
      headerName: 'Contact List ID',
      hide: true,
    },
    {
      field: 'ContactListConfigName',
      headerName: 'Contact List',
    },
    {
      field: 'ContactListTable',
      headerName: 'Contact List Table',
    },
    {
      field: 'PhoneListTable',
      headerName: 'Phone List Table',
    },
    {
      field: 'DncTable',
      headerName: 'Do Not Call Table',
    },
    {
      field: 'DncIdentifier',
      headerName: 'DNC Identifier',
    },
    {
      field: 'PhoneTypes',
      headerName: 'Phone Types',
      cellRenderer: ({ data: rowData }) => {
        const outputString = rowData?.PhoneTypes?.toString().replaceAll(
          ',',
          ', ',
        );
        return outputString != null ? outputString : 'None';
      },
    },
    {
      field: 'Compliance.DailyCallLimitRecord',
      headerName: 'Daily Call Limit (Record)',
      width: 200,
    },
    {
      field: 'Compliance.DailyCallLimitPhone',
      headerName: 'Daily Call Limit (Phone)',
      width: 200,
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
                setFilterName('Contact List Name');
              }}
            >
              Contact List Name{' '}
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Phone List Table');
              }}
            >
              Phone List Table
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Contact List Table');
              }}
            >
              Contact List Table
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('DNC Table');
              }}
            >
              DNC Table
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('DNC Identifier');
              }}
            >
              DNC Identifier
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Daily Call Limit (Record)');
              }}
            >
              Daily Call Limit (Record)
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Daily Call Limit (Phone)');
              }}
            >
              Daily Call Limit (Phone)
            </MenuItem>
          </Menu>
        </ButtonWrapper>
      </TitleWrapper>
      <GridWrapper>
        <ReactAGGrid
          name='contactList'
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

ContactListTable.defaultProps = {
  // bla: 'test',
};
