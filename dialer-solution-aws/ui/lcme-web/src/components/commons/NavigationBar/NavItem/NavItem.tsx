/* eslint-disable no-empty-pattern */
import { IconButton } from "@material-ui/core";
import React, { ReactNode } from "react";
import { Name, Wrapper } from "./NavItem.Styles";

interface INavItem {
  name: string;
  icon: ReactNode;
  route: string;
  onClick: (route: string) => void;
}

export const NavItem: React.FunctionComponent<INavItem> = ({
  name,
  icon,
  onClick,
  route,
}) => {
  return (
    <Wrapper>
      <IconButton onClick={() => onClick(route)}>{icon}</IconButton>
      <Name>{name}</Name>
    </Wrapper>
  );
};

NavItem.defaultProps = {
  // bla: 'test',
};
