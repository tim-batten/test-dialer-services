/* eslint-disable no-empty-pattern */
import React, { useState } from 'react';
import { Title, Wrapper } from './CampaignOversightLogs.Styles';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface ICampaignOversightLogs {}
const rowData = [
  {
    id: 1,
    data1: '9/22/2021',
    data2: '3.11',
    data3: '54738-905',
    data4: 'VND',
  },
  {
    id: 2,
    data1: '3/26/2021',
    data2: '7.16',
    data3: '41268-405',
    data4: 'CNY',
  },
  {
    id: 3,
    data1: '3/24/2021',
    data2: '0.4.2',
    data3: '55154-2735',
    data4: 'EUR',
  },
  {
    id: 4,
    data1: '4/29/2021',
    data2: '7.0',
    data3: '36987-1609',
    data4: 'CNY',
  },
  {
    id: 5,
    data1: '1/25/2021',
    data2: '0.5.0',
    data3: '50436-4565',
    data4: 'USD',
  },
  {
    id: 6,
    data1: '3/6/2021',
    data2: '0.63',
    data3: '11559-020',
    data4: 'IDR',
  },
  {
    id: 7,
    data1: '8/17/2021',
    data2: '0.56',
    data3: '41163-463',
    data4: 'PLN',
  },
  {
    id: 8,
    data1: '1/16/2021',
    data2: '6.2',
    data3: '37000-011',
    data4: 'CNY',
  },
  {
    id: 9,
    data1: '4/9/2021',
    data2: '0.38',
    data3: '67345-0011',
    data4: 'EUR',
  },
  {
    id: 10,
    data1: '8/15/2021',
    data2: '2.26',
    data3: '33261-833',
    data4: 'IDR',
  },
  {
    id: 11,
    data1: '10/2/2021',
    data2: '4.7',
    data3: '60505-0027',
    data4: 'CZK',
  },
  {
    id: 12,
    data1: '7/8/2021',
    data2: '0.13',
    data3: '0440-1866',
    data4: 'CNY',
  },
  {
    id: 13,
    data1: '12/18/2021',
    data2: '4.44',
    data3: '65862-082',
    data4: 'CNY',
  },
  {
    id: 14,
    data1: '7/29/2021',
    data2: '9.5.5',
    data3: '21695-039',
    data4: 'VND',
  },
  {
    id: 15,
    data1: '1/5/2021',
    data2: '9.04',
    data3: '0536-1275',
    data4: 'CNY',
  },
  {
    id: 16,
    data1: '3/20/2021',
    data2: '6.3.8',
    data3: '51655-107',
    data4: 'UAH',
  },
  {
    id: 17,
    data1: '9/6/2021',
    data2: '0.43',
    data3: '0116-1061',
    data4: 'SEK',
  },
  {
    id: 18,
    data1: '8/9/2021',
    data2: '0.6.9',
    data3: '16590-250',
    data4: 'XOF',
  },
  {
    id: 19,
    data1: '9/24/2021',
    data2: '0.1.1',
    data3: '50988-282',
    data4: 'JPY',
  },
  {
    id: 20,
    data1: '3/20/2021',
    data2: '5.0',
    data3: '53808-0820',
    data4: 'IDR',
  },
  {
    id: 21,
    data1: '4/14/2021',
    data2: '0.71',
    data3: '49288-0703',
    data4: 'PHP',
  },
  {
    id: 22,
    data1: '6/10/2021',
    data2: '3.4',
    data3: '51060-024',
    data4: 'BRL',
  },
  {
    id: 23,
    data1: '2/10/2021',
    data2: '1.90',
    data3: '64679-275',
    data4: 'CNY',
  },
  {
    id: 24,
    data1: '5/15/2021',
    data2: '2.31',
    data3: '33342-121',
    data4: 'IDR',
  },
  {
    id: 25,
    data1: '7/18/2021',
    data2: '8.2.1',
    data3: '30142-374',
    data4: 'MGA',
  },
  {
    id: 26,
    data1: '9/18/2021',
    data2: '0.77',
    data3: '68828-127',
    data4: 'CNY',
  },
  {
    id: 27,
    data1: '10/25/2021',
    data2: '7.9.4',
    data3: '55316-141',
    data4: 'ZAR',
  },
  {
    id: 28,
    data1: '9/11/2021',
    data2: '0.6.5',
    data3: '30142-476',
    data4: 'COP',
  },
  {
    id: 29,
    data1: '11/27/2021',
    data2: '0.5.1',
    data3: '11084-053',
    data4: 'CNY',
  },
  {
    id: 30,
    data1: '10/14/2021',
    data2: '6.11',
    data3: '54868-3362',
    data4: 'CNY',
  },
  {
    id: 31,
    data1: '3/5/2021',
    data2: '2.9.0',
    data3: '65862-327',
    data4: 'CNY',
  },
  {
    id: 32,
    data1: '8/12/2021',
    data2: '0.7.0',
    data3: '0113-0604',
    data4: 'EUR',
  },
  {
    id: 33,
    data1: '9/9/2021',
    data2: '0.66',
    data3: '66078-033',
    data4: 'ILS',
  },
  {
    id: 34,
    data1: '10/20/2021',
    data2: '5.66',
    data3: '0268-1072',
    data4: 'XOF',
  },
  {
    id: 35,
    data1: '11/3/2021',
    data2: '0.8.6',
    data3: '42291-895',
    data4: 'HNL',
  },
  {
    id: 36,
    data1: '10/5/2021',
    data2: '5.5.7',
    data3: '49884-054',
    data4: 'PEN',
  },
  {
    id: 37,
    data1: '6/18/2021',
    data2: '0.40',
    data3: '0009-0341',
    data4: 'IDR',
  },
  {
    id: 38,
    data1: '10/14/2021',
    data2: '7.3.1',
    data3: '60505-3113',
    data4: 'EUR',
  },
  {
    id: 39,
    data1: '3/26/2021',
    data2: '5.65',
    data3: '41499-105',
    data4: 'CNY',
  },
  {
    id: 40,
    data1: '10/8/2021',
    data2: '9.1',
    data3: '68472-138',
    data4: 'CNY',
  },
  {
    id: 41,
    data1: '2/3/2021',
    data2: '0.96',
    data3: '53329-807',
    data4: 'PHP',
  },
  {
    id: 42,
    data1: '11/27/2021',
    data2: '1.80',
    data3: '60432-065',
    data4: 'NGN',
  },
  {
    id: 43,
    data1: '1/28/2021',
    data2: '6.31',
    data3: '0615-5554',
    data4: 'IDR',
  },
  {
    id: 44,
    data1: '8/25/2021',
    data2: '4.6.8',
    data3: '54575-435',
    data4: 'USD',
  },
  {
    id: 45,
    data1: '11/25/2021',
    data2: '1.4',
    data3: '43063-323',
    data4: 'BRL',
  },
  {
    id: 46,
    data1: '7/10/2021',
    data2: '0.7.2',
    data3: '49999-017',
    data4: 'BRL',
  },
  {
    id: 47,
    data1: '12/26/2020',
    data2: '1.0',
    data3: '0496-0799',
    data4: 'EUR',
  },
  {
    id: 48,
    data1: '9/16/2021',
    data2: '2.8',
    data3: '42291-271',
    data4: 'IDR',
  },
  {
    id: 49,
    data1: '11/2/2021',
    data2: '4.9',
    data3: '51672-1349',
    data4: 'IDR',
  },
  {
    id: 50,
    data1: '6/29/2021',
    data2: '0.75',
    data3: '68016-290',
    data4: 'MXN',
  },
];
export const CampaignOversightLogs: React.FunctionComponent<
  ICampaignOversightLogs
> = ({}) => {
  const [rows, setRows] = useState(rowData);
  const columns: GridColDef[] = [
    {
      field: 'data1',
      headerName: 'Data 1',
      flex: 1,
    },
    {
      field: 'data2',
      headerName: 'Data 2',
      flex: 1,
    },
    {
      field: 'data3',
      headerName: 'Data 3',
      flex: 1,
    },
    {
      field: 'data4',
      headerName: 'Data 4',
      flex: 1,
    },
  ];
  return (
    <Wrapper>
      <Title> Historical Data </Title>
      <DataGrid
        rows={rowData}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        disableSelectionOnClick
        density='compact'
        // hideFooter
      />
    </Wrapper>
  );
};

CampaignOversightLogs.defaultProps = {
  // bla: 'test',
};
