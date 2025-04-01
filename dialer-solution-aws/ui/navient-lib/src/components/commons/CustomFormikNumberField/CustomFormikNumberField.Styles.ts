import IconButton from '@material-ui/core/IconButton';
import styled from 'react-emotion';
import { CustomFormikMUITextField } from '../CustomFormikMUITextField';

interface IWrapper {
  half?: boolean;
  fullWidth?: boolean;
}
export const Wrapper = styled('div')<IWrapper>`
  display: inline-flex;
  flex-direction: column;
  position: relative;
  ${(props) => (props.fullWidth ? `width: 100%` : ``)}
  ${(props) => (props.half ? `width: 49.3%` : ``)}
`;

export const NoSpinInput = styled(CustomFormikMUITextField)((props: any) => ({
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
      paddingRight: props.clear ? 84 : 60,
    },
  },
}));

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
