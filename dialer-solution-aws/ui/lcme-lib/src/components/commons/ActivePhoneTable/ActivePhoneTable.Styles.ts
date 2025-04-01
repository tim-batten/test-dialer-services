import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 5px;
`;
interface ICustomHelperText {
  error?: boolean;
}
export const CustomHelperText = styled('div')<ICustomHelperText>`
  color: ${(props) => (props.error ? 'red' : 'rgba(0, 0, 0, 0.54)')};
`;
