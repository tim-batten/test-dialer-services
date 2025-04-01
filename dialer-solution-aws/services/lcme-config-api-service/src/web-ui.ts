import express from 'express';
import { Logger } from 'lcme-services-common/lib/logger/logger';
import { serviceConfig } from './config/config';
import fsPromises from 'fs/promises';
import { ConnectInstanceServiceManager } from 'lcme-services-common/lib/utils/connect-helper';

const logger = Logger.getLogger();

export type SingleAccountConfig = {
  apiUrl: string;
  logRefreshRate: number;
};

export type MultiAccountConfig = {
  url: string;
  name: string;
  shortCode: string;
  color: string;
};

export type AmazonCognitoConfig = {
  region: string;
  userPoolId: string;
  userPoolAppClientId: string;
};

export type ConfigJson = {
  config: SingleAccountConfig;
  accounts: MultiAccountConfig[];
  amazonCognito: AmazonCognitoConfig;
  basePath: string;
};

export const hostWebUi = async (app: express.Express) => {
  const { uriPath = '/web', redirectRootToWebUi = true, sourcePath } = serviceConfig.webUi;
  logger.log('info', `Serving web UI from ${sourcePath}`);
  try {
    await fsPromises.access(sourcePath);
  } catch (e) {
    throw new Error(`Unable to access web UI source path: ${sourcePath}`);
  }
  const configJsonMode = serviceConfig.webUi.configJsonMode;
  if (configJsonMode === 'file') {
    try {
      await fsPromises.access(`${sourcePath}/config.json`);
    } catch (e) {
      throw new Error(`Unable to access web UI config.json file: ${sourcePath}/config.json`);
    }
  } else {
    logger.log('info', 'Generating config.json');
    const apiServiceAddress = serviceConfig.rest.getPublicAddress(serviceConfig.server.hostname);
    const generated: ConfigJson = {
      config: {
        apiUrl: apiServiceAddress,
        logRefreshRate: 10000,
      },
      accounts: [
        {
          url: apiServiceAddress,
          name: serviceConfig.db.namespace,
          shortCode: serviceConfig.db.namespace.substring(0, 3).toUpperCase(),
          color: '#000000',
        },
      ],
      amazonCognito: {
        region: (await ConnectInstanceServiceManager.getInstance().get()).connectConfig.AwsRegion,
        userPoolId: serviceConfig.cognito.userPoolId,
        userPoolAppClientId: serviceConfig.cognito.userPoolClientId,
      },
      basePath: uriPath,
    };
    const configJson: ConfigJson = generated;
    const configJs = `// @ts-nocheck
window.env = window.env || {};
window.env.envConfig = ${JSON.stringify(configJson)};`;
    app.get(`${uriPath}/config.js`, (req, res) => {
      res.header('Content-Type', 'application/javascript');
      res.send(configJs);
    });
  }
  app.use(uriPath, express.static(sourcePath));
  if (redirectRootToWebUi) {
    app.use('/', (req, res) => {
      res.redirect(uriPath);
    });
  }
};
