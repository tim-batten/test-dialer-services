import { useAuthenticator } from '@aws-amplify/ui-react';
import { Typography } from '@material-ui/core';
import { accounts, basePath } from '@navient/common/dist/src/frontend-config';
import React, { useEffect } from 'react';
import { BrowserRouter, Route, Switch, useHistory } from 'react-router-dom';
import { History } from 'history';
import { Navigation } from '../../AppEnums';
import logo from '../../img/NavientLogo.png';
import { getGlobalConfig } from '../../redux/actions/GlobalActions';
import { getRoles } from '../../redux/actions/RolesAccessAction';
import { useAppDispatch, useAppSelector } from '../../redux/hook';
import { logIn, logOut, setUserAccessLevel } from '../../redux/slices/loginSlice';
import { setRoute } from '../../redux/slices/navigationSlice';
import { UnauthorizedDialog } from '../UnauthorizedDialog/UnauthorizedDialog.component';
import { MainViewPanel } from '../commons/MainViewPanel';
import { NavigationBar } from '../commons/NavigationBar';
import { BaseWrapper, BodyWrapper, Header, Logo, Wrapper } from './App.Styles';

interface IApp {}

interface IBase {
  history: History;
}

function Base(props: IBase): React.ReactElement {
  const navRoute = useAppSelector((state) => state.navigation.route);
  const isLogin = useAppSelector((state) => state.login.isLogin);
  const role = useAppSelector((state) => state.rolesAccess.role);
  const authEnabled = useAppSelector((state) => state.rolesAccess.authEnabled);
  const history = useHistory();

  history.block((_location, _action) => {
    const onEditMode = localStorage.getItem('onEditMode');
    const path = window.location.href;
    if (!path.includes(navRoute) && onEditMode === '1') {
      if (!window.confirm('You have an unsaved work, are you sure you want to leave this page?')) {
        return false;
      } else {
        localStorage.setItem('onEditMode', '0');
      }
    }
  });

  const dispatch = useAppDispatch();
  useEffect(() => {
    props.history.push(navRoute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navRoute]);

  useEffect(() => {
    if (!isLogin) {
      dispatch(setRoute(Navigation.DefaultRoute));
      dispatch(logIn());
    }
  });

  useEffect(() => {
    dispatch(setUserAccessLevel(role));
  }, [role]);

  const { user, signOut } = useAuthenticator((context) => [context.user]);

  const handleLogOut = () => {
    signOut();
    user.signOut(() => {
      dispatch(logOut());
      props.history.push('/');
    });
  };

  return (
    <BaseWrapper>
      <UnauthorizedDialog role={role} handleLogOut={handleLogOut} user={user} />
      <Header>
        <Logo src={logo} alt="navient logo" />
        {authEnabled === false && (
          <Typography style={{ backgroundColor: 'red' }}>
            WARNING: Auth is disabled - every user treated as admin
          </Typography>
        )}
      </Header>
      <BodyWrapper>
        <NavigationBar history={props.history} handleLogOut={handleLogOut} />
        <MainViewPanel />
      </BodyWrapper>
    </BaseWrapper>
  );
}

export const App: React.FunctionComponent<IApp> = () => {
  const { user } = useAuthenticator((context) => [context.user]);
  const dispatch = useAppDispatch();

  useEffect(() => {
    localStorage.setItem('onEditMode', '0');
    sessionStorage.setItem('project_account', accounts[0].url);
    sessionStorage.setItem('config_account', accounts[0].url);

    dispatch(getGlobalConfig());
    dispatch(getRoles());
  }, [user]);

  return (
    <Wrapper>
      <BrowserRouter basename={basePath}>
        <Switch>
          <Route path="/" component={Base} />
        </Switch>
      </BrowserRouter>
    </Wrapper>
  );
};

App.defaultProps = {
  // bla: 'test',
};
