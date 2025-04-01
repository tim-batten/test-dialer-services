import { Typography } from '@material-ui/core';
import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: flex;
  width: 100%;
  flex-direction: column;
`;

export const TitleWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  // filter:blur(5px);
`;

export const Title = styled(Typography)({
  '&&': {
    fontWeight: 100,
  },
});
export const ButtonWrapper = styled('div')`
  display: flex;
  gap: 5px;
  height: 36.5px;
`;
