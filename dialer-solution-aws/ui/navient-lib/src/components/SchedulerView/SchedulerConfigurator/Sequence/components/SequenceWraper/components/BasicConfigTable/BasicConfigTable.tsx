/* eslint-disable no-unused-vars */
import { IBasicConfig } from '../../../../../../../commons/types/schedulerTypes';
import React from 'react';
import { Wrapper } from './BasicConfigTable.Styles';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface IBasicConfigTable {
  data?: IBasicConfig;
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
export const BasicConfigTable: React.FunctionComponent<IBasicConfigTable> = ({
  data,
}) => {
  const rows: RowProps[] = [
    // { id: '1', name: 'Clear Pacing', value: data?.clearPacing || '-' },
    {
      id: '1',
      name: 'Live Party Handler',
      value: data?.livePartyHandler || '-',
    },
    {
      id: '2',
      name: 'Live Party Contact Flow',
      value: data?.livePartyContactFlow || '-',
    },
    {
      id: '3',
      name: 'Answering Machine Handler',
      value: data?.answeringMachineHandler || '-',
    },
    {
      id: '4',
      name: 'Answering Machine Contact Flow',
      value: data?.answeringMachineContactFlow|| '-',
    },
    { id: '5', name: 'Phones', value: data?.phones.toString() || '-' },
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

BasicConfigTable.defaultProps = {
  // bla: 'test',
};
