import { TextField } from 'formik-material-ui';
import styled from 'react-emotion';

export const LabeledInput = styled(TextField)({
  '&&': {
    '& .MuiInputLabel-outlined.MuiInputLabel-shrink': {
      transform: `translate(0px, -15px) scale(0.75)`,
    },
    '& .MuiSelect-icon': {
      color: '#ffffff',
      backgroundColor: '#757575',
      width: 18,
      height: 18,
      borderRadius: 2,
      top: '50%',
      transform: 'translateY(-50%)',
    },
  },
});
