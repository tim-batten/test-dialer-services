import styled from 'react-emotion';
import Typography from '@material-ui/core/Typography';

export const Wrapper = styled('div')`
  min-width: 200px;
`;

export const Title = styled(Typography)({
  '&&': {
    fontWeight: 90,
  },
});

interface ICustomHelperText {
  error?: boolean;
}

export const CustomHelperText = styled('div')<ICustomHelperText>`
  color: ${(props) => (props.error ? 'red' : 'rgba(0, 0, 0, 0.54)')};
  font-size: 13px;
`;
