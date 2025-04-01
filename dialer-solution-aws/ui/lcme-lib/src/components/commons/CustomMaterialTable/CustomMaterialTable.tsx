/* eslint-disable no-empty-pattern */
import React from 'react';
import { Wrapper } from './CustomMaterialTable.Styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { IOption } from '../types/commonTypes';

interface ICustomMaterialTable {
  columns: IOption[];
  rows: any[];
  style?: React.CSSProperties;
}

export const CustomMaterialTable: React.FunctionComponent<
  ICustomMaterialTable
> = ({ rows, columns, style }) => {
  return (
    <Wrapper>
      <TableContainer component={Paper}>
        <Table style={style}>
          <TableHead>
            <TableRow>
              {columns?.map((col) => (
                <TableCell align='center'>{col.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows?.map((row, i) => (
              <>
                <TableRow key={i}>
                  {columns?.map((col) => (
                    <TableCell align='center'>{row[col.value]}</TableCell>
                  ))}
                </TableRow>
              </>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Wrapper>
  );
};

CustomMaterialTable.defaultProps = {
  // bla: 'test',
  style: {
    width: 400,
  },
};
