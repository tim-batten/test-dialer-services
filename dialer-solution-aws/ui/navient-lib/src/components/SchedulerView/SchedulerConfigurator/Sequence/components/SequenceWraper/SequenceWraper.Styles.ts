/* eslint-disable no-unused-vars */
import { DraggableProvidedDraggableProps } from 'react-beautiful-dnd';
import styled from 'react-emotion';

export const Wrapper = styled('div')<DraggableProvidedDraggableProps>`
  display: grid;
  grid-template-columns: 1fr auto;
  width: 100%;
`;
export const FormWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 5px;s
`;
export const ControlWrapper = styled('div')`
  height: 80px;
  display: flex;
  align-items: center;
  flex-direction: column;
`;
