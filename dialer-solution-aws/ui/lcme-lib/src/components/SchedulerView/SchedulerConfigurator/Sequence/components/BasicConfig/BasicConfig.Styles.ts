import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: grid;
  gap: 15px;
  flex: 1;
`;

export const TextGroupWrapper = styled('div')`
  display: grid;
  gap: 15px;
`;
export const TextWrapper = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
`;
