import styled from 'react-emotion';
import { Box } from '@material-ui/core';
import { IconButton, ButtonProps, Tooltip } from '@material-ui/core';

type IMyButton = ButtonProps & {
  customColor: string;
};

export const MyButton = styled(IconButton)<IMyButton>((props) => ({
  '&&': {
    color: props.customColor,
    background: 'none',
    cursor: 'auto',
    '&:hover': {
      background: 'none',
      backgroundColor: 'none',
      cursor: 'auto',
    },
  },
}));

export const ProgressWrapper = styled('div')`
  .MuiDataGrid-cell {
    line-height: 0px;
  }
`;

export const BoxWrapper = styled(Box)({
  '&&': {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    margin: 0,
  },
});

export const Status = styled('h5')`
  text-align: center;
  letter-spacing: 1px;
  font-weight: 600;
  margin: 0;
`;

export const CustomCell = styled('span')`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const MultilineText = styled('div')`
  line-height: 18px;
  white-space: normal;
`;
