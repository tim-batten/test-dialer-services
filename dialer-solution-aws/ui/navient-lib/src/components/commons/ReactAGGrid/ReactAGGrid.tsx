/* eslint-disable no-empty-pattern */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AgGridReact } from 'ag-grid-react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ColDef, IsRowSelectable, SelectionChangedEvent } from 'ag-grid-community';
import { GridHeaderWrapper, GridOtherContent, Wrapper } from './ReactAGGrid.Styles';
import { ActionsGenerator } from './ActionsGenerator';
import { IOption } from '../types/commonTypes';
import ColumnButton from '../ReactMaterialTable/ColumnButton';
import { isBaseURLAll } from '../../../api';
import _ from 'lodash';
import { GridHeader } from '@mui/x-data-grid';

interface IReactAGGrid {
  columns: ColDef[];
  rows: any[];
  actions?: IActions[];
  name: string;
  onRowClicked: (event, rowData) => void;
  autoResize?: boolean;
  rowSelection?: 'multiple' | 'single';
  isRowSelectable?: IsRowSelectable<any>;
  headerContent?: React.ReactNode;
  selectAllOnIsRowSelectableChange?: boolean;
  onSelectionChanged?(event: SelectionChangedEvent<any>): void;
}

export interface IActions {
  icon: () => React.ReactElement;
  tooltip: string;
  disabled?: boolean;
  onClick: (event, rowData) => void;
}

const ReactAGGrid: React.FunctionComponent<IReactAGGrid> = ({
  columns,
  rows,
  actions,
  name,
  onRowClicked,
  autoResize,
  rowSelection,
  isRowSelectable,
  headerContent,
  selectAllOnIsRowSelectableChange,
  onSelectionChanged
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const columnList: IOption[] = columns.map((col) => ({
    label: col.headerName as string,
    value: col.field as string,
  }));
  const [rowData] = useState(rows);
  const [columnDefs, setColumnDefs] = useState(columns);
  let _items: string[] =
    localStorage.getItem(`${name}_table`)?.split(',') || [];
  if (!_items || _items.length === 0) {
    _items = columns
      .filter(
        (col) =>
          !col.hide &&
          col.field &&
          col.field !== 'actions' &&
          col.field !== 'prjacc.name',
      )
      .map((col) => col.field) as string[];
    localStorage.setItem(`${name}_table`, _items.toString());
  }
  const actionElement = (actions: any): ColDef => {
    return {
      field: 'actions',
      headerName: 'Actions',
      pinned: 'left',
      width: actions.length * 40,
      minWidth: actions.length * 40,
      sortable: false,
      resizable: false,
      filter: false,
      suppressMovable: true,
      headerClass: 'center-text-header',
      cellRenderer: (row: any) => (
        <ActionsGenerator actions={actions} rowData={row} />
      ),
    };
  };
  useEffect(() => {
    if (actions) {
      const tempCols = [actionElement(actions)].concat(columns);
      setColumnDefs(tempCols);
    }
  }, [columns]);

  useEffect(() => {
    if (_items) refactorVisibleColumns(_items, columns);
  }, []);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      sortable: true,
      resizable: true,
      filter: true,
      filterParams: {
        buttons: ['apply', 'clear', 'cancel', 'reset'],
      },
      flex: 1,
      minWidth: 100,
    };
  }, []);

  const onChangeColumnHidden = (list: string[]) => {
    let sortedList = list;
    if (_items) {
      sortedList.sort((a, b) => _items.indexOf(a) - _items.indexOf(b));
    }
    if (!_.isEqual(_items, sortedList)) {
      _items = list;
      localStorage.setItem(`${name}_table`, _items.toString());
      refactorVisibleColumns(list, columns);
    }
  };

  const refactorVisibleColumns = (list, columns) => {
    const columnList = columnDefs
      .map((column) => {
        return {
          ...column,
          hide:
            column.field === 'actions'
              ? false
              : column.field === 'prjacc.name'
                ? !isBaseURLAll()
                : !list.find((lumn) => lumn === column.field),
        };
      })
      .sort((a, b) => {
        //Sort based on the order of the list
        return list.indexOf(a.field) - list.indexOf(b.field);
      });
    if (actions && !columnList.find((col) => col.field === 'actions')) {
      const tempCols = [actionElement(actions)].concat(columnList);
      setColumnDefs(tempCols);
    } else {
      setColumnDefs(columnList);
    }
  };

  const colBtnColumns = useMemo(
    () =>
      columnList.filter(
        (data) => data.value !== 'prjacc.name' && data.value !== 'actions',
      ),
    [columnList],
  );
  const colBtnValue = useMemo(
    () =>
      _items ||
      (columns as ColDef[])
        .filter((col) => !col.hide)
        .map((col) => col.field as string),
    [_items, columns],
  );

  const autoSizeAll = useCallback((skipHeader: boolean) => {
    const allColumnIds: string[] = [];
    gridRef.current!.columnApi.getAllColumns()!.forEach((column) => {
      allColumnIds.push(column.getId());
    });
    gridRef.current!.columnApi.autoSizeColumns(allColumnIds, skipHeader);
  }, []);

  useEffect(() => {
    if (isRowSelectable && selectAllOnIsRowSelectableChange) {
      gridRef.current?.api?.selectAll();
    }
  }, [isRowSelectable, selectAllOnIsRowSelectableChange])

  return (
    <Wrapper className='ag-theme-alpine'>
      <GridHeaderWrapper>
        <GridOtherContent>
          {headerContent}
        </GridOtherContent>
        <ColumnButton
          columns={colBtnColumns.sort((a, b) => a.label.localeCompare(b.label))}
          values={colBtnValue}
          onVisibilityChange={(columnList) => onChangeColumnHidden(columnList)}
        />
      </GridHeaderWrapper>
      <AgGridReact
        isRowSelectable={isRowSelectable}
        ref={gridRef}
        rowData={rows}
        onRowClicked={(e) => {
          if (name === 'campaignOversight') onRowClicked(e, e.data);
        }}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pagination
        animateRows
        onSelectionChanged={onSelectionChanged}
        rowSelection={rowSelection}
        onColumnMoved={(props) => {
          if (!props.toIndex) return;
          const allColumns = props.columnApi.getAllColumns()!;
          const oldIdx = allColumns.findIndex(
            (col) => col.getId() === props.column?.getId(),
          );
          allColumns.splice(props.toIndex, 0, allColumns.splice(oldIdx, 1)[0]);
          const newColumnOrder = allColumns
            .map((col) => col.getId())
            .filter((col) => _items?.includes(col));
          _items = newColumnOrder;
          localStorage.setItem(`${name}_table`, _items.toString());
        }}
        onVirtualColumnsChanged={() => {
          if (autoResize) autoSizeAll(false);
        }}
        onGridColumnsChanged={() => {
          if (autoResize) autoSizeAll(false);
        }}
      ></AgGridReact>
    </Wrapper>
  );
};

ReactAGGrid.defaultProps = {
  // bla: 'test',
};

export default React.memo(
  ReactAGGrid,
  (oldProps, newProps) =>
    JSON.stringify(oldProps.rows) === JSON.stringify(newProps.rows)
    && JSON.stringify(oldProps.columns) === JSON.stringify(newProps.columns)
    && oldProps.isRowSelectable === newProps.isRowSelectable,
);
