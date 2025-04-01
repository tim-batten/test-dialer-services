/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
import { Button, Divider } from '@material-ui/core';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { TextFieldProps } from 'formik-material-ui';
import React, { useState } from 'react';
import {
  ButtonWrapper,
  CustomTextField,
  GridWrapper,
  Wrapper,
} from './CustomAttributeField.Styles';

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
    editable: true,
  },
  {
    field: 'value',
    headerName: 'Value',
    flex: 1,
    editable: true,
  },
];

export const CustomAttributeField: React.FunctionComponent<TextFieldProps> = (
  props,
) => {
  const rows: RowProps[] = (props.field.value as any[]).map((value) => ({
    id: value.name,
    ...value,
  }));
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  const getNameError = (): string => {
    let _error = '';
    if (rows.find((r) => r.name === name)) {
      _error = 'Already Exists';
    }
    if (error && value !== '' && !name) {
      _error = 'Required';
    }
    return _error;
  };

  const getValueError = (): string => {
    let _error = '';
    if (error && name !== '' && !value) {
      _error = 'Required';
    }
    return _error;
  };

  const reSetNameValue = () => {
    setName('');
    setValue('');
  };

  const addAttributes = () => {
    var _rows: any[] = [...rows].map((val) => ({
      name: val.name,
      value: val.value,
    }));
    _rows.push({ name, value });
    props.form.setFieldValue(props.field.name, _rows);
    reSetNameValue();
  };

  const deleteAttributes = () => {
    var _rows: any[] = [...rows];

    selectedRows.forEach((row_id) => {
      const row = _rows.find((row) => row.id === row_id);
      const index = _rows.indexOf(row);
      _rows.splice(index, 1);
    });

    const formattedRow = _rows.map((val) => ({
      name: val.name,
      value: val.value,
    }));
    props.form.setFieldValue(props.field.name, formattedRow);
    reSetNameValue();
  };

  const onHandleName = (name: string) => {
    setName(name);
  };

  return (
    <Wrapper>
      <GridWrapper>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          checkboxSelection
          disableSelectionOnClick
          autoHeight
          density='compact'
          onSelectionModelChange={(e) => setSelectedRows(e as any)}
          onCellEditCommit={(e) => {
            var _rows: any[] = [...rows];
            const row = _rows.find((row) => row.id === e.id);
            const index = _rows.indexOf(row);
            const newRow: any = {
              id: row.id,
              name: row.name,
              value: row.value,
            };

            newRow[e.field] = e.value;
            if (e.field === 'name') {
              newRow.id = e.value;
            }

            _rows.splice(index, 1, newRow);
            props.form.setFieldValue(props.field.name, _rows);
          }}
        />
      </GridWrapper>
      <ButtonWrapper>
        <Button
          variant='outlined'
          color='primary'
          disabled={selectedRows.length <= 0}
          onClick={() => deleteAttributes()}
        >
          Delete Attribute(s)
        </Button>
      </ButtonWrapper>
      <Divider />
      <ButtonWrapper>
        <CustomTextField
          label='Name'
          placeholder='Name'
          variant='outlined'
          margin='dense'
          fullWidth
          InputLabelProps={{
            shrink: true,
          }}
          InputProps={{
            notched: false,
          }}
          value={name}
          onChange={(e) => onHandleName(e.target.value)}
          error={!!rows.find((r) => r.name === name) || (error && !name)}
          helperText={getNameError()}
        />
        <CustomTextField
          label='Value'
          placeholder='Value'
          variant='outlined'
          margin='dense'
          fullWidth
          InputLabelProps={{
            shrink: true,
          }}
          InputProps={{
            notched: false,
          }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          error={error && !value}
          helperText={getValueError()}
        />
      </ButtonWrapper>
      <ButtonWrapper className='form-buttons'>
        <Button
          variant='contained'
          color='primary'
          onClick={() => {
            if (rows.find((r) => r.name === name) || !name || !value) {
              setError(true);
            } else {
              setError(false);
              addAttributes();
            }
          }}
        >
          Add New Attributes
        </Button>
      </ButtonWrapper>
      <Divider />
    </Wrapper>
  );
};

CustomAttributeField.defaultProps = {
  // bla: 'test',
};
