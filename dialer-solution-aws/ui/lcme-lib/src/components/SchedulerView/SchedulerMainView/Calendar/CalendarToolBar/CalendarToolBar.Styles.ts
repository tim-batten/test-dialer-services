import { TextField, Dialog } from '@material-ui/core';
import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
export const StyledTextField = styled(TextField)({
  '&&': {
    width: 250,
  },
});

export const RightWrapper = styled('div')`
  display: flex;
  gap: 5px;
`;
export const NavigationWrapper = styled('div')`
  display: flex;
  gap: 5px;
`;
