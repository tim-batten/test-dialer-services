/* eslint-disable no-empty-pattern */
import React from "react";
import { Wrapper } from "./NavigationBar.Styles";
import { NavigationList } from "./NavigationList";

interface INavigationBar {
  history: any;
  handleLogOut: () => void;
}

export const NavigationBar: React.FunctionComponent<INavigationBar> = (
  props
) => {
  return (
    <Wrapper>
      {/* <Apps fontSize="large" htmlColor="#ffffff" /> */}
      <NavigationList history={props.history} handleLogOut={props.handleLogOut} />
    </Wrapper>
  );
};

NavigationBar.defaultProps = {
  // bla: 'test',
};
