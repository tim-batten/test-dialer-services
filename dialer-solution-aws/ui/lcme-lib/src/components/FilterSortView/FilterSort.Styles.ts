import styled from 'react-emotion';
import Typography from '@material-ui/core/Typography';
import { TextareaAutosize } from '@material-ui/core';

export const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: auto;
`;

export const FormWrapper = styled('div')`
  height: 100%;
  width: 65%;
  margin-right: 1vh;
`;
export const Title = styled(Typography)({
  '&&': {
    fontWeight: 100,
  },
});
export const TitleWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  // filter:blur(5px);
`;
export const ButtonWrapper = styled('div')`
  display: flex;
  gap: 5px;
`;
