import styled from 'react-emotion';
import { TextField } from '@material-ui/core';

export const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 5px;
  padding: 20px;
`;
export const GridWrapper = styled('div')`
  display: flex;
  width: 100%;
  height: 100%;
`;
export const TitleWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0px;
`;
export const ListItemWrapper = styled('div')`
  display: flex;
  flex-direction: row;
`;
export const CustomTextField = styled(TextField)({
  '&&': {
    width: 300,
  },
});

export const MultilineText = styled('div')`
  line-height: 18px;
  white-space: normal;
`;
