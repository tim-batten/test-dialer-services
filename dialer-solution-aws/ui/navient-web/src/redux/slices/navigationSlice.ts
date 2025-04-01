import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface NavigationState {
  route: string;
}

const initialState: NavigationState = {
  route: "/",
};

export const navigationSlice = createSlice({
  name: "navigation",
  initialState,
  reducers: {
    setRoute: (state, action: PayloadAction<any>) => {
      state.route = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setRoute } = navigationSlice.actions;

export default navigationSlice.reducer;
