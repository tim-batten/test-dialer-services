import { DroppableProvidedProps } from 'react-beautiful-dnd';
import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;
export const InputWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

export const ButtonWrapper = styled('div')`
  display: flex;
  margin-top: 10px;
  gap: 15px;
`;
export const ItemList = styled('div')<DroppableProvidedProps>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

interface ICustomHelperText {
  error?: boolean;
}

export const CustomHelperText = styled('div')<ICustomHelperText>`
  color: ${(props) => (props.error ? 'red' : 'rgba(0, 0, 0, 0.54)')};
`;
