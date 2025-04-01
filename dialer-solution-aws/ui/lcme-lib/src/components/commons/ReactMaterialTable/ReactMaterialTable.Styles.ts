import styled from 'react-emotion';

export const Wrapper = styled('div')`
  &
    .MuiTableCell-root.MuiTableCell-body.MuiTableCell-paddingNone.MuiTableCell-sizeSmall
    > div {
    justify-content: space-evenly;
  }
`;
export const Toolbar = styled('div')`
  position: relative;
  display: flex;
`;
export const Extras = styled('div')`
  flex: 1;
  display: flex;
  align-items: center;
  padding-left: 10px;
  padding-top: 12px;
`;
