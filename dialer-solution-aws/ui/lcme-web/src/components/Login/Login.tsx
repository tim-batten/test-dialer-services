/* eslint-disable no-empty-pattern */
import { Button, CircularProgress } from '@material-ui/core';
import React, { useState } from 'react';
import { Navigation } from '../../AppEnums';
import { useAppDispatch } from '../../redux/hook';
import { logIn } from '../../redux/slices/loginSlice';
import { setRoute } from '../../redux/slices/navigationSlice';
import { Wrapper } from './Login.Styles';

interface ILogin {
  history: any;
}

export const Login: React.FunctionComponent<ILogin> = (props) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const dispatch = useAppDispatch();

  const handleLogin = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
      props.history.push(Navigation.DefaultRoute);
      setIsLoggingIn(false);
      dispatch(logIn());
      dispatch(setRoute(Navigation.DefaultRoute));
    }, 3000);
  };
  return (
    <Wrapper>
      {isLoggingIn ? (
        <CircularProgress />
      ) : (
        <Button
          onClick={() => handleLogin()}
          variant='contained'
          color='primary'
        >
          Login
        </Button>
      )}
    </Wrapper>
  );
};

Login.defaultProps = {
  // bla: 'test',
};
