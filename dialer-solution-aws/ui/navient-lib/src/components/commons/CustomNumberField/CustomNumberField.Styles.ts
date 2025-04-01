import { TextField } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import styled from 'react-emotion';

interface IWrapper {
  fullWidth?: boolean;
}
export const Wrapper = styled('div')<IWrapper>`
  display: inline-flex;
  flex-direction: column;
  position: relative;
  ${(props) => (props.fullWidth ? `width: 100%` : ``)}
`;
export const NoSpinInput = styled(TextField)({
  '&&': {
    '& input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button':
      {
        WebkitAppearance: 'none',
        margin: 0,
      },
    '& .MuiInputLabel-outlined.MuiInputLabel-shrink': {
      transform: `translate(0px, -15px) scale(0.75)`,
    },
    '& .MuiOutlinedInput-input': {
      paddingRight: 60,
    },
  },
});

export const HoverIconButton = styled(IconButton)(({ theme }) => ({
  '&&': {
    '& :hover': {
      color: theme?.colors?.focusColor || '#197bdd',
    },
    padding: 0,
  },
}));

export const IconWrapper = styled('div')`
  display: flex;
  position: absolute;
  right: 5px;
  top: 15px;
`;
