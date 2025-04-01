/* eslint-disable no-unused-vars */
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React from 'react';
import { isIOption } from '../../../../../../../commons/types/commonTypes';
import { IFilteringNSorting } from '../../../../../../../commons/types/schedulerTypes';
import { Wrapper } from './FNSTable.Styles';

interface IFNSTable {
  data?: IFilteringNSorting;
}

interface RowProps {
  id: string;
  name: string;
  value: any;
}

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Name',
    flex: 1,
  },
  {
    field: 'value',
    headerName: 'Value',
    flex: 1,
  },
];
export const FNSTable: React.FunctionComponent<IFNSTable> = ({ data }) => {
  const rows: RowProps[] = [
    {
      id: '1',
      name: 'Contact Filters',
      value:
        data?.contactFilters
          .map((data) => (isIOption(data) ? data.label : data))
          .toString() || '-',
    },
    {
      id: '2',
      name: 'Phone Filters',
      value:
        data?.phoneFilters
          .map((data) => (isIOption(data) ? data.label : data))
          .toString() || '-',
    },
    {
      id: '3',
      name: 'Contact Sorting',
      value:
        data?.contactSorting
          .map((data) => (isIOption(data) ? data.label : data))
          .toString() || '-',
    },
  ];
  return (
    <Wrapper>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        hideFooter
        autoHeight
        density='compact'
      />
    </Wrapper>
  );
};

FNSTable.defaultProps = {
  // bla: 'test',
};
