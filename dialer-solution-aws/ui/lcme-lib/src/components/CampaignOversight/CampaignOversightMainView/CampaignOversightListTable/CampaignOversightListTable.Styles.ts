import styled from 'react-emotion';
import { TextField } from '@material-ui/core';
import { IconButton, ButtonProps } from '@material-ui/core';

type IMyButton = ButtonProps & {
  customColor: string;
};

export const MyButton = styled(IconButton)<IMyButton>((props) => ({
  '&&': {
    color: props.customColor,
  },
}));

export const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 5px;
  padding: 15px;
`;

export const TitleWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0px;
`;

export const CustomTextField = styled(TextField)({
  '&&': {
    width: 300,
  },
});

export const GridWrapper = styled('div')`
  display: flex;
  width: 100%;
  height: 100%;
`;

export const ListItemWrapper = styled('div')`
  display: flex;
  flex-direction: row;
`;
