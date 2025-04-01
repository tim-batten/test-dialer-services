/* eslint-disable no-empty-pattern */
import MaterialTable, {
  Column,
  MaterialTableProps,
} from '@material-table/core';
import React, { useEffect, useState } from 'react';
import { isBaseURLAll } from '../../../api';
import { IOption } from '../types/commonTypes';
import ColumnButton from './ColumnButton';
import { Extras, Toolbar, Wrapper } from './ReactMaterialTable.Styles';

type IReactMaterialTable = MaterialTableProps<any> & {
  name: string;
  extras?: React.ReactNode;
};

export const ReactMaterialTable: React.FunctionComponent<
  IReactMaterialTable
> = (props) => {
  const columnList: IOption[] = props.columns.map((col) => ({
    label: col.title as string,
    value: col.field as string,
  }));
  const [columns, setColumns] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const items = localStorage.getItem(`${props.name}_table`);

  useEffect(() => {
    const tableCol = columns.map((_col) => {
      const col = { ..._col };
      delete col.tableData;
      return {
        cellStyle: _col.cellStyle,
        field: _col.field,
        hidden: _col.hidden,
        resizable: _col.resizable,
        title: _col.title,
        width: _col.width,
      };
    });

    setTableColumns(tableCol);
  }, [columns]);

  useEffect(() => {
    const cols = props.columns.map((data, index) => {
      return {
        ...data,
        hidden: data.field === 'prjacc.name' ? !isBaseURLAll() : data.hidden,
        resizable: true,
        cellStyle: {
          whiteSpace: 'nowrap',
          borderRight: '1px solid #ddd',
          background: '#ffffff',
          fontWeight: 400,
          fontFamily: 'Roboto',
          fontSize: 13,
          overflow: 'auto',
        },
      };
    });

    if (items) {
      refactorVisibleColumns(items.split(','), cols);
    } else {
      setColumns(cols);
    }
  }, [props.columns]);

  const refactorVisibleColumns = (list, columns) => {
    const columnList = columns.map((col) => {
      const column = { ...col };
      if (column && column.tableData) {
        delete column.tableData;
      }

      return {
        ...column,
        hidden:
          column.field === 'prjacc.name'
            ? !isBaseURLAll()
            : !list.find((lumn) => lumn === column.field),
      };
    });

    setColumns(
      columnList.map((_col) => {
        const col = { ..._col };
        delete col.tableData;

        return col;
      }),
    );
  };

  useEffect(() => {
    if (props.actions) {
      setActions(
        props.actions?.map((data) => ({
          ...data,
          iconProps: {
            fontSize: 'small',
          },
          cellStyle: {
            borderRight: '1px solid #ddd',
          },
        })),
      );
    }
  }, [props.actions]);

  const onChangeColumnHidden = (list) => {
    const _columns = columns.map((col) => {
      const _col = { ...col };
      delete _col.tableData;
      return _col;
    });
    localStorage.setItem(`${props.name}_table`, list.toString());
    refactorVisibleColumns(list, _columns);
  };
  return (
    <Wrapper>
      <MaterialTable
        {...props}
        options={{
          tableLayout: 'fixed',
          columnResizable: true,
          pageSize: 20,
          pageSizeOptions: [20],
          maxBodyHeight: 'calc(100vh - 331px)',
          minBodyHeight: 'calc(100vh - 331px)',
          actionsCellStyle: {
            color: '#757575',
            fontSize: 20,
            marginRight: '1em',
            borderRight: '1px solid #ddd',
          },
          headerStyle: {
            whiteSpace: 'nowrap',
          },
          search: false,
          showTitle: false,
          // columnsButton: true,
          // doubleHorizontalScroll: true,
          ...props.options,
        }}
        style={{
          boxShadow: 'none',
          border: '1px solid #e0e0e0',
          borderRadius: 4,
          ...props.style,
        }}
        columns={tableColumns}
        actions={actions}
        components={{
          Toolbar: (_props) => {
            const _items = localStorage
              .getItem(`${props.name}_table`)
              ?.split(',');
            return (
              <Toolbar>
                <Extras>{props.extras}</Extras>
                <ColumnButton
                  columns={columnList.filter(
                    (data) => data.value !== 'prjacc.name',
                  )}
                  values={
                    _items ||
                    (_props.columns as Column<any>[])
                      .filter((col) => !col.hidden)
                      .map((col) => col.field as string)
                  }
                  onVisibilityChange={(columnList) =>
                    onChangeColumnHidden(columnList)
                  }
                />
              </Toolbar>
            );
          },
        }}
        onColumnDragged={(src, dst) => {
          const newcols = columns.map((c) => {
            const c1 = { ...c };

            if (c1 && c1.tableData) {
              delete c1.tableData;
            }
            return c1;
          });
          // const visCols = newcols.filter((c) => !c.hidden);

          const srcCol = newcols[src];
          const dstCol = newcols[dst];

          // const srcNewIdx = newcols.findIndex((c) => srcCol.field === c.field);
          // const dstNewIdx = newcols.findIndex((c) => dstCol.field === c.field);

          newcols.splice(src, 1);
          newcols.splice(dst, 0, srcCol);

          setColumns(
            newcols.map((col) => {
              if (col && col.tableData) {
                delete col.tableData;
              }
              return col;
            }),
          );
        }}
      >
        ReactMaterialTable context
      </MaterialTable>
    </Wrapper>
  );
};

ReactMaterialTable.defaultProps = {
  // bla: 'test',
};
