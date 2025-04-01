// @ts-nocheck
window.env = window.env || {};
window.env.envConfig = {
  config: {
    apiUrl: 'http://localhost:44444',
    logRefreshRate: 10000,
  },
  accounts: [
    {
      url: 'http://localhost:44444',
      name: 'My first Connect account',
      shortCode: 'ACC_1',
      color: 'blue',
    },
    {
      url: 'https://bd7c-84-67-192-117.ngrok-free.app',
      name: 'My second Connect account',
      shortCode: 'ACC_2',
      color: 'red',
    },
  ],
  amazonCognito: {
    region: 'us-west-2',
    userPoolId: 'us-west-2_rD7ycSAxV',
    userPoolAppClientId: '3kj9esf83ie3m2gbsrshi4u3vh',
  },
  basePath: '/web',
};
