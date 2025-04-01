/* eslint-disable no-unused-vars */
import {
  DraggableProvidedDraggableProps,
  DroppableProvidedProps,
} from 'react-beautiful-dnd';
import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  min-width: 200px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 3px;
  padding: 5px;
  gap: 5px;
`;
export const ColumnStyle = styled('div')`
  display: flex;
  flex-direction: column;
  position: relative;
`;
export const ColumnHeader = styled('div')`
  display: flex;
  width: 100%;
  padding: 5px 10px;
  box-sizing: border-box;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.875rem;
  font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
`;
export const ItemStyle = styled('div')<DraggableProvidedDraggableProps>`
  display: flex;
  flex-shrink: 0;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  justify-content: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.875rem;
  font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #ffffff;
  user-select: none;
  &:hover {
    background-color: rgba(63, 81, 181, 0.08);
  }
`;
export const ItemList = styled('div')<DroppableProvidedProps>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  max-height: 205px;
  overflow: overlay;
`;

export const FieldWrapper = styled('div')`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 5px;
`;
interface ICustomHelperText {
  error?: boolean;
}
export const CustomHelperText = styled('div')<ICustomHelperText>`
  color: ${(props) => (props.error ? 'red' : 'rgba(0, 0, 0, 0.54)')};
`;

export const SortWrapper = styled('div')`
  position: absolute;
  right: 0px;
  & .MuiIconButton-sizeSmall {
    padding: 0;
  }
`;
