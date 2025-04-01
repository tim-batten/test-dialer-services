/* eslint-disable no-empty-pattern */
import React, { useEffect, useState } from 'react';
import { IOption } from '../../types/commonTypes';
import { Wrapper } from './ColumnButton.Styles';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { ViewColumn } from '@material-ui/icons';
import { Checkbox, FormControlLabel } from '@material-ui/core';
import { Column } from '@material-table/core';

interface IColumnButton {
  columns: IOption[];
  values: string[];
  onVisibilityChange: (columns: string[]) => void;
}

const ColumnButton: React.FunctionComponent<IColumnButton> = ({
  columns,
  onVisibilityChange,
  values,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    onVisibilityChange(visibleColumns);
  };

  useEffect(() => {
    setVisibleColumns(values);
  }, [values]);

  const isChecked = (column: string) => {
    return !!visibleColumns.find((col) => col === column);
  };

  const onChangeColumnHidden = (column: string, show: boolean) => {
    const columnsList = [...visibleColumns];

    const selected = columnsList.find((c) => c === column);
    const index = selected && columnsList.indexOf(selected);

    if (show) {
      !selected && columnsList.push(column);
    } else {
      selected && columnsList.splice(index || 0, 1);
    }
    setVisibleColumns(columnsList);
  };

  return (
    <Wrapper>
      <IconButton
        aria-label='more'
        aria-controls='long-menu'
        aria-haspopup='true'
        onClick={handleClick}
      >
        <ViewColumn />
      </IconButton>
      <Menu
        id='column-button-menu'
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {columns.map((col) => (
          <MenuItem>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isChecked(col.value as string)}
                  name={col.value as string}
                  onChange={(e) =>
                    onChangeColumnHidden(col.value as string, e.target.checked)
                  }
                />
              }
              label={col.label}
            />
          </MenuItem>
        ))}
      </Menu>
    </Wrapper>
  );
};

ColumnButton.defaultProps = {
  // bla: 'test',
};

export default React.memo(
  ColumnButton,
  (oldProps, newProps) =>
    JSON.stringify(oldProps.values) === JSON.stringify(newProps.values) &&
    JSON.stringify(oldProps.columns) === JSON.stringify(newProps.columns),
);
