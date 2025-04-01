import styled from "react-emotion";

export const ListWrapper = styled("div")`
  display: flex;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding-bottom: 15px;
  & :last-child {
    margin-top: auto;
  }
  & .MuiIconButton-colorSecondary {
    color: #f50057;
  }
  & .MuiButtonBase-root {
    padding: 12px;
  }
`;
