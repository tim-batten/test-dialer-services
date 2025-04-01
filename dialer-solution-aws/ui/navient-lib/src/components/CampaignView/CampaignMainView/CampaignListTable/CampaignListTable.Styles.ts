import { TextField } from '@material-ui/core';
import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 5px;
`;
export const TitleWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0px;
`;
export const TableWrapper = styled('div')`
  display: flex;
  width: 100%;
  height: calc(100vh - 270px);
`;


export const CustomTextField = styled(TextField)({
  '&&': {
    width: 300,
  },
});

export const GridWrapper = styled('div')`
  display: flex;
  width: 100%;
  height: calc(100vh - 270px);
`;

export const CellWrapper = styled('div')`
  min-width: 175px;
  max-width: 175px;
  line-height: 49px;
  min-height: 50px;
  max-height: 50px;
`;
export const ListItemWrapper = styled('div')`
  display: flex;
  flex-direction: row;
`;

export const MultilineText = styled('div')`
  line-height: 18px;
  white-space: normal;
`;
