import { Typography } from '@material-ui/core';
import styled from 'react-emotion';
import { TextField } from '@material-ui/core';

export const Wrapper = styled('div')`
  display: flex;
  width: 100%;
  flex-direction: column;
`;

export const TitleWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
`;
export const Title = styled(Typography)({
  '&&': {
    fontWeight: 100,
  },
});

export const ButtonWrapper = styled('div')`
  display: flex;
  gap: 5px;
`;
export const Content = styled('div')`
  display: grid;
  width: 100%;
  gap: 15px;
  padding: 15px;
  overflow: overlay;
  &::-webkit-scrollbar {
    width: 2px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  &::-webkit-scrollbar-thumb {
    background: #888;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  .rbc-event {
    display: grid;
  }
`;

export const CustomTextField = styled(TextField)({
  '&&': {
    width: 300,
  },
});
