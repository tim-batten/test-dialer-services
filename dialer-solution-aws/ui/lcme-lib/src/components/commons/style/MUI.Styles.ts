import { IconButton, InputAdornment, Typography } from '@material-ui/core';
import styled from 'react-emotion';

export const CustomNumberFieldInputAdornment = styled(InputAdornment)({
  '&&': {
    position: 'absolute',
    right: 55,
  },
});

export const SubName = styled(Typography)({
  '&&': {
    opacity: 0.5,
  },
});

export const NoPadIconButton = styled(IconButton)({
  '&&': {
    padding: 0,
  },
});

export const ErrorText = styled(Typography)({
  '&&': {
    color: 'red',
  },
});
