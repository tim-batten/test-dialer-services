import { Paper } from '@material-ui/core';
import styled from 'react-emotion';

interface IWrapper {
  open: boolean;
}
export const Wrapper = styled('div') <IWrapper>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 999;
  pointer-events: none;
  display: ${props => props.open ? 'flex' : 'none'}
`;

export const OuterContentWrapper = styled(Paper)({
  '&&': {
    padding: 10,
    pointerEvents: 'all'
  },
});

export const DragHandle = styled('div')`
  padding: 5px 14px;
  cursor: move;
`;

export const InnerContentWrapper = styled('div')`
  padding: 8px 14px;
  padding-left: 0;
  max-height: 400px;
  overflow-y: auto;
  border-bottom: 1px solid #ddd;
  border-top: 1px solid #ddd;
`;