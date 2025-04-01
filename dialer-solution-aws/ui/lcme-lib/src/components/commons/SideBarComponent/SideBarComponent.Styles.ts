import styled from 'react-emotion';

interface IWrapper {
  topOffSet?: number;
}

export const Wrapper = styled('div')<IWrapper>`
  display: grid;
  width: 100%;
  grid-template-columns: 1fr auto;
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
}
export const InnerContent = styled('div')<IInnerContent>`
  display: 'flex';
  visibility: ${(props) => (props.open ? 'visible' : 'hidden')};
  width: ${(props) =>
    props.open ? (props.size === 'large' ? '700px' : '450px') : '0px'};
  transition: all 0.5s ease;
  position: ${(props) => (props.floating ? 'absolute' : 'relative')};
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  background: #ffffff;
  min-height: 100%;
  height: 100%;
  right: 0;
  z-index: 999;
`;

interface IContentWrapper {
  disable: boolean;
}
export const ContentWrapper = styled('div')<IContentWrapper>`
  height: 100%;
  ${(props) =>
    props.disable
      ? `
    & .MuiInputBase-root, .MuiAutocomplete-root, .MuiIconButton-root, input, .DuoColumnSelector, .form-buttons, .MuiFormGroup-root {
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

ContentWrapper.defaultProps = {
  disable: false,
};
interface IButtonWrapper {
  disable: boolean;
}

export const ButtonWrapper = styled('div')<IButtonWrapper>`
  gap: 5px;
  position: absolute;
  top: 0px;
  right: 30px;
  display: ${(props) => (props.disable ? 'none' : 'flex')};
`;
ButtonWrapper.defaultProps = {
  disable: true,
};
