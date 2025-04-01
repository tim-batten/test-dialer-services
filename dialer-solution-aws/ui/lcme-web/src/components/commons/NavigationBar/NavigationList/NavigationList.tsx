/* eslint-disable no-empty-pattern */
import { IconButton } from '@material-ui/core';
import BarChart from '@material-ui/icons/BarChart';
import Event from '@material-ui/icons/Event';
import ExitToApp from '@material-ui/icons/ExitToApp';
import Filter from '@material-ui/icons/Filter';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import LocalLibrary from '@material-ui/icons/LocalLibrary';
import Settings from '@material-ui/icons/Settings';
import { ADMINISTRATOR } from '@lcme/common/dist/src/constants';
import { Auth } from 'aws-amplify';
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../redux/hook';
import { setRoute } from '../../../../redux/slices/navigationSlice';
import { NavItem } from '../NavItem';
import { ListWrapper } from './NavigationList.Styles';

interface INavigationList {
  history: any;
  handleLogOut: () => void;
}

export const NavigationList: React.FunctionComponent<INavigationList> = (props) => {
  const { handleLogOut } = props;
  const navRoute = useAppSelector((state) => state.navigation.route);
  const user_access = useAppSelector((state) => state.login.user.accessLevel);
  const dispatch = useAppDispatch();

  const handleRouteChange = (route: string) => {
    // props.history.push(route);
    dispatch(setRoute(route));
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await Auth.currentSession();
        const isValid = session.isValid();
        if (!isValid) {
          handleLogOut();
        }
      } catch (error) {
        // Handle any errors or log them as needed
        handleLogOut();
      }
    };

    const interval = setInterval(checkSession, 60000); // Check session validity every minute

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);
  return (
    <ListWrapper>
      <NavItem
        name="Scheduler"
        icon={<Event htmlColor={navRoute === 'schedules' ? '#ffffff' : '#d4d4d4'} />}
        route="schedules"
        onClick={(route: string) => handleRouteChange(route)}
      />
      <NavItem
        name="Campaigns"
        icon={<LocalLibrary htmlColor={navRoute === 'campaigns' ? '#ffffff' : '#d4d4d4'} />}
        route="campaigns"
        onClick={(route: string) => handleRouteChange(route)}
      />
      <NavItem
        name="Oversight"
        icon={<BarChart htmlColor={navRoute === 'campaign_oversight' ? '#ffffff' : '#d4d4d4'} />}
        route="campaign_oversight"
        onClick={(route: string) => handleRouteChange(route)}
      />
      <NavItem
        name="Filters"
        icon={<Filter htmlColor={navRoute === 'filter_sort' ? '#ffffff' : '#d4d4d4'} />}
        route="filter_sort"
        onClick={(route: string) => handleRouteChange(route)}
      />
      <NavItem
        name="Contacts"
        icon={<LibraryBooks htmlColor={navRoute === 'contacts' ? '#ffffff' : '#d4d4d4'} />}
        route="contacts"
        onClick={(route: string) => handleRouteChange(route)}
      />
      <NavItem
        name="Config"
        icon={<Settings htmlColor={navRoute === 'config' ? '#ffffff' : '#d4d4d4'} />}
        route="config"
        onClick={(route: string) => handleRouteChange(route)}
      />
      <IconButton onClick={() => handleLogOut()} color="secondary">
        <ExitToApp />
      </IconButton>
    </ListWrapper>
  );
};

NavigationList.defaultProps = {
  // bla: 'test',
};
