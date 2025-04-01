import styled from 'react-emotion';
import Typography from '@material-ui/core/Typography';

export const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: auto;
`;

export const TitleWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
`;

export const FormWrapper = styled('div')`
  height: 100%;
  width: calc(100% - 10px);
  margin-right: 1vh;
`;

export const FormContainer = styled('div')`
  margin: 1.5em;
  width: 70%;
`;

export const Account = styled('p')`
  width: 100%;
  margin-left: 1em;
  font-size: 14px;
  padding: 1em;
`;

export const Title = styled(Typography)({
  '&&': {
    fontWeight: 100,
  },
});

export const ButtonWrapper = styled('div')`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

export const ButtonWrapper2 = styled('div')`
  display: flex;
  gap: 5px;
`;

interface IContentWrapper {
  disable: boolean;
}

export const ContentWrapper = styled('div')<IContentWrapper>`
  height: 100%;
  ${(props) =>
    props.disable
      ? `
    & .MuiInputBase-root, .MuiAutocomplete-root, .MuiIconButton-root, input, .DuoColumnSelector, .form-buttons, .MuiFormGroup-root, .MuiSlider-root {
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

export const FormLayout = styled('div')`
  display: flex;
  align-items: start;
`;

ContentWrapper.defaultProps = {
  disable: false,
};
