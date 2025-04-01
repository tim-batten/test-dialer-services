import { IconButton, Tooltip } from '@material-ui/core';
import { ImportExport, Sort } from '@material-ui/icons';
import React, { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { TopLabeledTextField } from '../..';
import { IOption, isIOption } from '../../types/commonTypes';
import {
  ColumnHeader,
  ColumnStyle,
  ItemList,
  SortWrapper,
} from '../DuoColumnSelector.Styles';
import { Item } from './Item';

interface IColumn {
  columnName: string;
  columnID: string;
  items: (string | IOption)[];
  onItemClick: (
    droppableId: string,
    draggableId: string | IOption,
    index: number,
  ) => void;
  onReverse: () => void;
  onSort: () => void;
}

export const Column: React.FunctionComponent<IColumn> = ({
  columnName,
  columnID,
  items,
  onItemClick,
  onReverse,
  onSort,
}) => {
  const [filter, setFilter] = useState('');
  return (
    <ColumnStyle>
      <ColumnHeader>
        <div>{columnName}</div>
        <SortWrapper>
          <Tooltip title='Sort'>
            <IconButton
              size='small'
              component='span'
              onClick={() => items.length > 0 && onSort()}
            >
              <Sort fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Reorder'>
            <IconButton
              size='small'
              component='span'
              onClick={() => items.length > 0 && onReverse()}
            >
              <ImportExport fontSize='small' />
            </IconButton>
          </Tooltip>
        </SortWrapper>
      </ColumnHeader>
      <TopLabeledTextField
        name='columnName'
        label=''
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={columnName}
      />
      <Droppable droppableId={columnID}>
        {(provided) => (
          <ItemList innerRef={provided.innerRef} {...provided.droppableProps}>
            {items
              ?.filter((i) => {
                if (isIOption(i)) {
                  return (
                    i.label.toLowerCase()?.indexOf(filter.toLowerCase()) !== -1
                  );
                } else {
                  return i.toLowerCase()?.indexOf(filter.toLowerCase()) !== -1;
                }
              })
              .map((item, index) => (
                <Item
                  key={index}
                  value={item}
                  id={index}
                  onItemClick={(draggableId, index) =>
                    onItemClick(columnID, draggableId, index)
                  }
                />
              ))}
            {provided.placeholder}
          </ItemList>
        )}
      </Droppable>
    </ColumnStyle>
  );
};

Column.defaultProps = {
  // bla: 'test',
};
