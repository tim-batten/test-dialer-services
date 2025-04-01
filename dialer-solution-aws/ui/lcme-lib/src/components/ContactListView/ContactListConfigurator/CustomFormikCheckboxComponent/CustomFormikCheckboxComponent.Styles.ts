import { FormControlLabel } from '@material-ui/core';
import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

// export const CheckBoxWrapper = styled('div')`
//   display: flex;
//   justify-content: space-evenly;
// `;

interface ICustomHelperText {
  error?: boolean;
}
export const CustomHelperText = styled('div')<ICustomHelperText>`
  color: ${(props) => (props.error ? 'red' : 'rgba(0, 0, 0, 0.54)')};
`;
export const CompactFormControlLabel = styled(FormControlLabel)({
  '&&': {
    marginLeft: 0,
    marginRight: 0,
  },
});
