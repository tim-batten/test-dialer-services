import { Dialog } from '@material-ui/core';
import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: flex;
`;

interface IIndependentDialog {
  hideBackdrop: boolean
}

export const IndependentDialog = styled(Dialog)<IIndependentDialog>((props) => ({
  '&&': {
    pointerEvents: props.hideBackdrop ? 'none' : 'all',
    '& .react-draggable': {
      pointerEvents: 'all',
    }
  },
}));