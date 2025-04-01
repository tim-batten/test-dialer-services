import { TextField } from '@material-ui/core';
import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: flex;
  width: 100%;
  gap: 15px;
  flex-direction: column;
`;
export const ButtonWrapper = styled('div')`
  display: flex;
  gap: 15px;
`;
export const GridWrapper = styled('div')`
  display: flex;
  width: 100%;
  max-height: 400px;
`;
export const CustomTextField = styled(TextField)({
  '&&': {
    '& .MuiInputLabel-outlined.MuiInputLabel-shrink': {
      transform: `translate(0px, -15px) scale(0.75)`,
    },
  },
});
