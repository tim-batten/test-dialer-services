import { MenuItem, TextField } from "@material-ui/core";
import styled from "react-emotion";

export const Wrapper = styled("div")`
  height: 100vh;
  width: 100vw;
  display: flex;
  overflow: hidden;
`;
export const BaseWrapper = styled("div")`
  height: 100vh;
  width: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
`;

export const Header = styled("div")`
  height: 40px;
  width: 100%;
  background: #46464e;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Logo = styled("img")`
  height: 20px;
  padding: 5px;
  box-sizing: content-box;
  display: inline-flex;
  background: #fff;
  margin-left: 5px;
`;
export const BodyWrapper = styled("div")`
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: 50px 1fr;
  gap: 5px;
`;

export const ALTexField = styled(TextField)({
  "&&": {
    marginTop: 0,
    marginRight: 10,
    "& .MuiInputBase-root.MuiOutlinedInput-root": {
      color: "#ffffff",
    },
    "& .MuiSelect-outlined.MuiInputBase-input": {
      padding: "7px 32px 7px 14px",
    },
    "& .PrivateNotchedOutline-root-1": {
      borderColor: "gray",
    },
    "& .MuiSelect-icon": {
      color: "#ffffff",
    },
  },
});

export const ALMenuItem = styled(MenuItem)({
  "&&": {
    display: "flex",
    padding: "6px 16px",
    justifyContent: "flex-start",
  },
});
