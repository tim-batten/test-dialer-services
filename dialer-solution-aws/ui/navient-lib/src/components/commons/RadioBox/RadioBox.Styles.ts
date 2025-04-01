import { Radio } from '@material-ui/core';
import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: flex;
`;

export const RadioStyled = styled(Radio)({
  '&&': {
    fontWeight: 100,
  },
});
