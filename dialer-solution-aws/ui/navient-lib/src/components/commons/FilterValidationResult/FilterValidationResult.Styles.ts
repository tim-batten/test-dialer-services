import { Accordion } from '@material-ui/core';
import styled from 'react-emotion';

export const Wrapper = styled('div')`
  display: flex;
`;

export const ContentWrapper = styled('div')`
  min-width: 500px;
  min-height: 400px;
`
export const LoadingWrapper = styled('div')`
  display:flex;
  align-items: center;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 13px;
`

export const DataWrapper = styled('div')`
  display: flex;
  font-size: 13px;
`
export const ErrorWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 25px;
  flex: 1;
`

export const ErrorTitle = styled('div')`
  font-size: 25px;
  font-weight: bold;
`
export const MessageWrapper = styled('div')`
  display: flex;
  gap: 5px;
  flex-direction: column;
`
export const MessageText = styled('div')`
  display: flex;
  font-weight: 600;
`
export const MessageContent = styled('div')`
  display: flex;
`
export const AdditionalErrorWrapper = styled('div')`
  display: flex;
  & .MuiAccordion-root {
    flex: 1;
  }
`

export const SuccessWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 25px;
  flex: 1;
`
export const RowWrapper = styled('div')`
  display: flex;
  & div {
    flex: 1;
  }
`

export const SeeMore = styled(Accordion)({
  '&&': {
    width: 100
  },
});