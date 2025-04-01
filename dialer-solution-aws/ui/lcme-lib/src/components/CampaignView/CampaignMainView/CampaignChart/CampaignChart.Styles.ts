import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 500px;
`;
export const GraphWrapper = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  justify-items: center;
`;
