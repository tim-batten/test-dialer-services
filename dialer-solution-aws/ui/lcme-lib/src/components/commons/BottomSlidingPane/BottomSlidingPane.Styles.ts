import { Typography } from '@material-ui/core';
import styled from 'react-emotion';

interface IWrapper {
  topOffSet?: number;
}

export const Wrapper = styled('div')<IWrapper>`
  display: grid;
  width: 100%;
  grid-template-rows: 1fr auto;
  gap: 5px;
  position: relative;
  height: ${(props) => `calc(100% - ${props.topOffSet}px)`};
`;

Wrapper.defaultProps = {
  topOffSet: 0,
};
export const OuterContent = styled('div')`
  display: flex;
  min-height: 100%;
`;

interface IInnerContent {
  open?: boolean;
  size?: 'medium' | 'large';
  floating?: boolean;
  topOffSet?: number;
}
export const InnerContent = styled('div')<IInnerContent>`
  display: 'flex';
  visibility: ${(props) => (props.open ? 'visible' : 'hidden')};
  width: 100%;
  transition: all 0.5s ease;
  position: ${(props) => (props.floating ? 'absolute' : 'relative')};
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  background: #ffffff;
  height: ${(props) =>
    props.open
      ? props.size === 'large'
        ? `calc(100vh - ${props.topOffSet}px)`
        : '350px'
      : '0px'};
  right: 0;
  bottom: 0;
  background: #fff;
  z-index: 999;
`;

interface IButtonWrapper {
  disable: boolean;
}

export const ButtonWrapper = styled('div')<IButtonWrapper>`
  gap: 5px;
  display: ${(props) => (props.disable ? 'none' : 'flex')};
`;
ButtonWrapper.defaultProps = {
  disable: true,
};

export const InnerContentWrapper = styled('div')`
  display: grid;
  width: 100%;
  grid-template-rows: auto 1fr;
`;

interface IInnerContentContainer {
  open?: boolean;
  size?: 'medium' | 'large';
  floating?: boolean;
  disable?: boolean;
  topOffSet?: number;
}
export const InnerContentContainer = styled('div')<IInnerContentContainer>`
  display: flex;
  background: #ffffff;
  height: ${(props) =>
    props.open
      ? props.size === 'large'
        ? `calc(100vh - ${
            (props.topOffSet || 0) + (props.floating ? 0 : 43)
          }px)`
        : `${350}px`
      : '0px'};
  padding: 10px;
  box-sizing: border-box;
  overflow: overlay;
  ${(props) =>
    props.disable
      ? `
    & .MuiInputBase-root, .MuiAutocomplete-root, .MuiIconButton-root, input, [data-rbd-droppable-id], .form-buttons, .MuiFormGroup-root, textarea {
    cursor:text
    user-select: none;
    pointer-events: none;
    & button{
      color: rgba(0, 0, 0, 0.26);
      box-shadow: none;
      background-color: rgba(0, 0, 0, 0.12);
    }
}


  }`
      : ''}
`;

export const InnerTopBar = styled('div')`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
`;

export const Title = styled(Typography)({
  '&&': {
    fontWeight: 450,
    fontSize: 18,
    padding: '.75em',
  },
});
