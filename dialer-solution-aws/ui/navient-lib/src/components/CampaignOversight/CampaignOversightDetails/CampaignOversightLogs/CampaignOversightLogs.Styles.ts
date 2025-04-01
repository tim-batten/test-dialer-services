import { Typography } from '@material-ui/core';
import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: grid;
  grid-template-rows: auto 1fr;
  width: 100%;
  min-height: 400px;
`;
export const Title = styled(Typography)({
  '&&': {
    fontWeight: 400,
    fontSize: 15,
  },
});
