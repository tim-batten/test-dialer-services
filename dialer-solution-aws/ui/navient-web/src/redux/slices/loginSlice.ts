import { AccessRoles } from '@navient/common';
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface LoginState {
  isLogin: boolean;
  user: {
    accessLevel: AccessRoles;
  };
}

const initialState: LoginState = {
  isLogin: false,
  user: {
    accessLevel: AccessRoles.NONE,
  },
};

export const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    logIn: (state) => {
      state.isLogin = true;
    },
    logOut: (state) => {
      state.isLogin = false;
    },
    saveUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
    },
    setUserAccessLevel: (state, action: PayloadAction<any>) => {
      state.user = { ...state.user, accessLevel: action.payload };
    },
  },
});

// Action creators are generated for each case reducer function
export const { logIn, logOut, setUserAccessLevel } = loginSlice.actions;

export default loginSlice.reducer;
