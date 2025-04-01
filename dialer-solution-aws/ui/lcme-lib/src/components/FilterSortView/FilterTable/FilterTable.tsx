/* eslint-disable no-empty-pattern */
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip
} from '@material-ui/core';
import { Visibility } from '@material-ui/icons';
import DeleteOutlineOutlinedIcon from '@material-ui/icons/DeleteOutlineOutlined';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import FilterListIcon from '@material-ui/icons/FilterList';
import FindReplaceOutlinedIcon from '@material-ui/icons/FindReplaceOutlined';
import { ColDef } from 'ag-grid-community';
import React, { useCallback, useEffect, useState } from 'react';
import { isBaseURLAll } from '../../../api/utils';
import ReactAGGrid from '../../commons/ReactAGGrid';
import { ButtonWrapper } from '../FilterSort.Styles';
import { ValidationPane } from './ValidationPane';
import {
  CustomTextField,
  GridWrapper, TitleWrapper,
  Wrapper
} from './FilterTable.Styles';
import { FilterValidationResult } from '../../commons/FilterValidationResult';

interface IFilterTable {
  filterData: any;
  deleteRow: (id: any) => void;
  handleOnRowEdit: Function;
  viewRow: Function;
  openBar: boolean;
  contactLists: any;
}

export const FilterTable: React.FunctionComponent<IFilterTable> = ({
  filterData,
  deleteRow,
  viewRow,
  handleOnRowEdit,
  openBar,
  contactLists
}) => {
  const [rows, setRows] = useState(filterData);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [filterName, setFilterName] = useState<string>('Filter/Sort Name');
  const [filterTarget, setFilterTarget] = useState<string>('');
  const [contactListValidate, setContactListValidate] = useState<string>('');
  const [validateOpen, setValidateOpen] = useState<boolean>(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [openValidationResult, setOpenValidationResult] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<any[]>([]);

  useEffect(() => {
    setRows(filterData);
  }, [filterData]);

  const columns: ColDef[] = [
    {
      headerName: 'Account Name',
      field: 'prjacc.name',
      hide: !isBaseURLAll(),
      width: 200,
    },
    {
      field: 'filterName',
      headerName: 'Filter Name',
      checkboxSelection: validateOpen,
      headerCheckboxSelection: validateOpen,
      showDisabledCheckboxes: true
      // renderCell: ({ row }) => {
      //   return <MultilineText>{row?.filterName}</MultilineText>;
      // },
    },
    {
      field: 'filterType',
      headerName: 'Filter Type',
    },
    {
      field: 'tableCL',
      headerName: 'Contact List',
      // width: 200,
      // flex: 1,
      // headerAlign: 'center',
      // renderCell: ({ row }) => {
      //   return <MultilineText>{row?.tableCL}</MultilineText>;
      // },
    },
    {
      field: 'filterOrSort',
      headerName: 'Filter/Sort',
      // width: 150,
      // flex: 1,
      // headerAlign: 'center',
    },
    {
      field: 'filterSQL',
      headerName: 'SQL Filter',
      // width: 200,
      // flex: 1,
      // headerAlign: 'center',
      // renderCell: ({ row }) => {
      //   return <MultilineText>{row?.filterSQL}</MultilineText>;
      // },
    },
  ];

  const handleFilterMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchor(event.currentTarget);
  };
  const handleCloseFilter = () => {
    setFilterAnchor(null);
  };
  const filteredRow = (filterMode) => {
    const lowerTarget = filterTarget.toLowerCase();
    switch (filterMode) {
      case 'Filter/Sort Name':
        return rows.filter((row: any) => {
          return row.filterName?.toLowerCase().indexOf(lowerTarget) !== -1;
        });
      case 'Contact List Name':
        return rows.filter((row: any) => {
          return row.tableCL?.toLowerCase().indexOf(lowerTarget) !== -1;
        });
      default:
        return rows;
    }
  };

  const isRowSelectable = useCallback((params) => {
    return (params.data.tableCL === contactListValidate || contactListValidate === '') && validateOpen;
  }, [contactListValidate, validateOpen]);


  return (
    <Wrapper>
      <TitleWrapper>
        {' '}
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
                setFilterName('Filter/Sort Name');
              }}
            >
              Filter/Sort Name{' '}
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseFilter();
                setFilterName('Contact List Name');
              }}
            >
              Contact List Name
            </MenuItem>
          </Menu>
        </ButtonWrapper>
      </TitleWrapper>
      <GridWrapper>
        <ReactAGGrid
          name='filter'
          columns={columns}
          onRowClicked={(e) => { }}
          rows={filteredRow(filterName)}
          rowSelection={validateOpen ? 'multiple' : undefined}
          isRowSelectable={isRowSelectable}
          selectAllOnIsRowSelectableChange={true}
          onSelectionChanged={event => {
            setSelectedFilters(event.api.getSelectedRows())
          }}
          actions={[
            {
              icon: () => <EditOutlinedIcon />,
              tooltip: 'Edit User',
              disabled: openBar,
              onClick: (event, rowData) => {
                handleOnRowEdit(rowData, true);
              },
            },
            {
              icon: () => <FindReplaceOutlinedIcon />,
              tooltip: 'Copy',
              disabled: openBar,
              onClick: (event, rowData) => {
                handleOnRowEdit(rowData, false);
              },
            },
            {
              icon: () => <Visibility />,
              tooltip: 'View',
              disabled: openBar,
              onClick: (event, rowData) => {
                viewRow(rowData);
              },
            },
            {
              icon: () => <DeleteOutlineOutlinedIcon />,
              tooltip: 'Delete',
              disabled: openBar,
              onClick: (event, rowData) => {
                deleteRow(rowData.id);
              },
            },
          ]}
          // headerContent={
          //   <ValidationPane
          //     contactLists={contactLists}
          //     onContactListChange={value => setContactListValidate(value)}
          //     onOpenChange={open => {
          //       setValidateOpen(open)
          //     }}
          //     onValidate={() => setOpenAlert(true)}
          //   />}
        />
      </GridWrapper>
      <Dialog
        open={openAlert}
        onClose={() => setOpenAlert(false)}
        aria-labelledby='alert-delete'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-delete'>Validate Filters</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Validation request can take up to 10 mins. Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAlert(false)} color='primary'>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setOpenAlert(false)
              setOpenValidationResult(true)
            }}
            color='primary'
            autoFocus
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
      <FilterValidationResult
        title='Validate Filter'
        open={openValidationResult}
        onClose={() => setOpenValidationResult(false)}
        data={{}}
      />
    </Wrapper>
  );
};

FilterTable.defaultProps = {
  // bla: 'test',
};
