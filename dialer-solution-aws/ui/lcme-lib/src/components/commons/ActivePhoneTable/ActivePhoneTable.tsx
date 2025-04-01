/* eslint-disable no-unused-vars */
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { TextFieldProps } from 'formik-material-ui';
import React from 'react';
import { CustomHelperText, Wrapper } from './ActivePhoneTable.Styles';

interface RowProps {
  id: string;
  active: string;
  inactive: any;
}

const columns: GridColDef[] = [
  {
    field: 'active',
    headerName: 'Active',
    flex: 1,
    editable: true,
  },
  {
    field: 'inactive',
    headerName: 'Inactive',
    flex: 1,
    editable: true,
  },
];

const rows: RowProps[] = [
  { id: '1', active: '', inactive: 'Home' },
  { id: '2', active: '', inactive: 'Cell' },
  { id: '3', active: '', inactive: 'Work' },
  { id: '4', active: '', inactive: 'Other' },
];

/**
 * @deprecated Use DuoColumnSelector instead
 */
export const ActivePhoneTable: React.FunctionComponent<TextFieldProps> = (
  props,
) => {
  const getRow = () => {
    const values = props.field.value as any[];
    const _rows = rows.map((row) => {
      const val = row.active || row.inactive;
      if (values.find((_val) => _val === val)) {
        return { id: row.id, active: val, inactive: '' };
      } else {
        return { id: row.id, active: '', inactive: val };
      }
    });
    return _rows;
  };

  const onRowClickHandle = (row: RowProps) => {
    const activeValue = props.field.value as any[];
    const val = row.active || row.inactive;
    if (activeValue.find((_val) => _val === val)) {
      const index = activeValue.indexOf(val);
      activeValue.splice(index, 1);
    } else {
      activeValue.push(val);
    }
    props.form.setFieldValue(props.field.name, activeValue);
    props.form.setFieldTouched(props.field.name, true);
  };
  const willError =
    props.form.touched[props.field.name] &&
    !!props.form.errors[props.field.name];
  return (
    <Wrapper>
      <CustomHelperText>{props.label}</CustomHelperText>
      <DataGrid
        rows={getRow()}
        columns={columns}
        pageSize={4}
        rowsPerPageOptions={[4]}
        onRowClick={(e) => onRowClickHandle(e.row as RowProps)}
        hideFooter
        autoHeight
        density='compact'
      />

      {willError && (
        <CustomHelperText error={willError}>
          {props.form.errors[props.field.name]}
        </CustomHelperText>
      )}
    </Wrapper>
  );
};

ActivePhoneTable.defaultProps = {
  // bla: 'test',
};
