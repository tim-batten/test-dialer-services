import styled from 'react-emotion';
import Typography from '@material-ui/core/Typography';

export const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  padding: 10px;
  max-width: 800px;
  height: 100%;
  box-sizing: border-box;
`;

export const FormWrapper = styled('div')`
  height: 100%;
  overflow: overlay;
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
