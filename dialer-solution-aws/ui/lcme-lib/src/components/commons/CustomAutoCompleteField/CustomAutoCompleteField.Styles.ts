import { TextField } from 'formik-material-ui';
import styled from 'react-emotion';

interface IWrapper {
  half?: boolean;
}

export const Wrapper = styled('div')<IWrapper>`
  display: inline-flex;
  flex-direction: column;
  position: relative;
  ${(props) => (props.half ? `width: 49.3%` : ``)}
`;

export const LabeledInput = styled(TextField)({
  '&&': {
    '& .MuiInputLabel-outlined.MuiInputLabel-shrink': {
      transform: `translate(0px, -15px) scale(0.75)`,
    },
    '& .MuiAutocomplete-popupIndicator': {
      color: '#ffffff',
      backgroundColor: '#757575',
      width: 18,
      height: 18,
      borderRadius: 2,
    },
  },
});
