import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { ItemStyle } from '../DuoColumnSelector.Styles';
import { IOption, isIOption } from '../../types/commonTypes';

interface IItem {
  value: string | IOption;
  id: number;
  onItemClick: (draggableId: string | IOption, index: number) => void;
}

export const Item: React.FunctionComponent<IItem> = ({
  value,
  id,
  onItemClick,
}) => {
  const text = isIOption(value) ? value.label : value;
  const val = isIOption(value) ? value.value : value;
  return (
    <Draggable draggableId={val} index={id} key={val + id}>
      {(provided) => (
        <ItemStyle
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          innerRef={provided.innerRef}
          onClick={() => onItemClick(value, id)}
        >
          {text}
        </ItemStyle>
      )}
    </Draggable>
  );
};

Item.defaultProps = {
  // bla: 'test',
};
