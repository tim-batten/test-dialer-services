import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hook';
import { Box, CircularProgress, Typography } from '@material-ui/core';
import { getApiStatusAction } from '../../redux/actions/StatusActions';
import { Amplify, Auth } from 'aws-amplify';
import { amazonCognito } from '@lcme/common/dist/src/frontend-config';
import { config_baseURL, interceptorManager } from '@lcme/common';
import { Authenticator, Heading, Text, View, useTheme } from '@aws-amplify/ui-react';
import { PersistGate } from 'redux-persist/integration/react';
import { App } from '../App/App';
import { persistor } from '../../redux/store';
import { CountdownTimer } from '@lcme/common/dist/src/components/commons/CountdownTimer';

Amplify.configure({
  Auth: {
    region: amazonCognito.region,
    userPoolId: amazonCognito.userPoolId,
    userPoolWebClientId: amazonCognito.userPoolAppClientId,
  },
});

interceptorManager.addRequestInterceptor({
  onFullfilled: async (config) => {
    const userSession = await Auth.currentSession().catch((err) => {
      console.log('Error getting user session', err);
      throw err;
    });
    const accessToken = userSession.getAccessToken();
    config.headers = config.headers || {};
    config.headers['x-cognito-jwt'] = accessToken.getJwtToken();
    return config;
  },
});

export const AppWrapper = () => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(getApiStatusAction());
  }, []);
  const apiStatus = useAppSelector((state) => state.apiStatus);
  const { loading, error, status } = apiStatus;
  if (loading || (!status && !error)) {
    return (
      <Box>
        <Typography>Loading...</Typography>
        <CircularProgress />
      </Box>
    );
  } else if (error) {
    setTimeout(() => {
      dispatch(getApiStatusAction());
    }, 10000);
    return (
      <Box>
        <Typography>
          API Cannot be Reached: {error.message ? error.message : `${error}`}. Ensure correct API endpoint is configured
          - this is currently set to {config_baseURL()}
        </Typography>
        <CountdownTimer seconds={10} label='Retrying in: ' />
      </Box>
    );
  }
  return (
    <Authenticator
      components={{
        SignIn: {
          Footer() {
            const { tokens } = useTheme();
            const OriginalFooter = Authenticator.SignIn.Footer;
            return (
              <Box>
                <OriginalFooter />
                <Text color={tokens.colors.neutral} paddingLeft={tokens.space.small} paddingBottom={tokens.space.small}>
                  Namespace: {status?.serviceName}
                </Text>
              </Box>
            );
          },
        },
      }}
    >
      <App />
    </Authenticator>
  );
};
