import styled from 'react-emotion';
import Typography from '@material-ui/core/Typography';

export const Wrapper = styled('div')`
  display: grid;
  flex-direction: column;
  padding: 10px;
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
export const ButtonWrapper = styled('div')`
  display: flex;
  gap: 15px;
`;

export const ConfigWrapper = styled('div')`
  margin: 10px 30px;
`;
