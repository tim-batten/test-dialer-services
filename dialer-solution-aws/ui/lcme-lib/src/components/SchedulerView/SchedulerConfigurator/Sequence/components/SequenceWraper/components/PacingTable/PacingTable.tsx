/* eslint-disable no-unused-vars */
import {
  IBasicConfig,
  IPacingSeq,
} from '../../../../../../../commons/types/schedulerTypes';
import React from 'react';
import { Wrapper } from './PacingTable.Styles';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface IPacingTable {
  data?: IPacingSeq;
}

interface RowProps {
  id: string;
  name: string;
  value: any;
  hide?: boolean;
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

export const PacingTable: React.FunctionComponent<IPacingTable> = ({
  data,
}) => {
  const rows: RowProps[] = [
    { id: '1', name: 'Clear Pacing', value: data?.clearPacing || '-' },
    {
      id: '2',
      name: 'Initial Calls per Agent',
      value: data?.initialCpa || '-',
      hide: data?.clearPacing === 'no',
    },
    {
      id: '3',
      name: 'Initial Calls per Agent Mode',
      value: data?.initialCpaMode || '-',
      hide: data?.clearPacing === 'no',
    },
    {
      id: '4',
      name: 'Initial Pacing Duration',
      value: data?.initialDuration || '-',
      hide: data?.clearPacing === 'no',
    },
    {
      id: '5',
      name: 'ABA Increment',
      value: data?.abaIncrement || '-',
      hide: data?.clearPacing === 'no',
    },
    {
      id: '6',
      name: 'CPA Modifier',
      value: data?.cpaModifier || '-',
      hide: data?.clearPacing === 'no',
    },
    {
      id: '7',
      name: 'ABA Calculation',
      value: data?.abaCalculation || '-',
      hide: data?.clearPacing === 'no',
    },
    {
      id: '8',
      name: 'ABA Target Rate %',
      value: data?.abaTargetRate || '-',
      hide: data?.clearPacing === 'no',
    },
  ];
  return (
    <Wrapper>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        hideFooter
        autoHeight
        density='compact'
      />
    </Wrapper>
  );
};

PacingTable.defaultProps = {
  // bla: 'test',
};
