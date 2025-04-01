import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

export const RightWrapper = styled('div')`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 20px;
  pointer-events: none;
`;

export const LeftWrapper = styled('div')`
  display: flex;
  width: 100%;
  flex-direction: column;
  form {
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }
`;

export const PacingHeaderWrapper = styled('div')`
  display: flex;
  width: 100%;
  justify-content: space-between;
  margin-bottom: 1em;
`;

interface IPacingBodyWrapper {
  isReadOnly: boolean;
}

export const PacingBodyWrapper = styled('div')<IPacingBodyWrapper>`
  pointer-events: ${(props) => (props.isReadOnly ? 'none' : 'all')};
  user-select: ${(props) => (props.isReadOnly ? 'none' : 'auto')};
  margin: 0;
  margin-bottom: 5px;
  padding: 0;
`;

export const ButtonWrapper = styled('div')`
  display: flex;
  width: 100%;
  justify-content: left;
  gap: 5px;
`;

export const ConfigWrapper = styled('div')`
  margin: 10px 0px;
`;
