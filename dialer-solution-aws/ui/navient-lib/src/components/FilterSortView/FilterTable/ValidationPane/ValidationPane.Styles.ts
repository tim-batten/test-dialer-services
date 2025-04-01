import { Button } from '@material-ui/core';
import styled from 'react-emotion';

interface IWrapper {
  open: boolean;
}
export const Wrapper = styled('div') <IWrapper>`
  display: flex;
  border: 1px solid #ddd;
  border-radius: 5px;
  width: ${props => props.open ? '350px' : '99px'};
  height: 40px;
  transition: width .5s;
  gap: 5px;
  padding: ${props => props.open ? '2px' : '0'};
  overflow: hidden;
`;

interface IOpenerWrapper {
  open: boolean;
}
export const OpenerWrapper = styled('div') <IOpenerWrapper>`
  display: flex;
  border-right: ${props => props.open ? '1px solid #ddd' : 'none'};
`;

export const Opener = styled(Button)({
  '&&': {
    minWidth: 0,
    padding: '6px 6px',
    '& .MuiButton-startIcon': {
      marginLeft: 0,
      marginRight: 0
    },
  },
});

interface IContentWrapper {
  open: boolean;
}
export const ContentWrapper = styled('div') <IContentWrapper>`
  display: flex;
  visibility: ${props => props.open ? 'visible' : 'hidden'};
  opacity: ${props => props.open ? '1' : '0'};
  transition: .5s;
  width: 100%;
  gap: 5px;
`;