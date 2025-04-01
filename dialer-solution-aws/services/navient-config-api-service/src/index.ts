import 'reflect-metadata';
import { serviceConfig } from './config/config';
// Always init logger immediately before other imports (other than serviceConfig)
import { Logger } from 'navient-services-common/lib/logger/logger';
Logger.init(serviceConfig.logging);

import { ServiceManager } from 'navient-services-common/lib/utils/service-manager';
import { startExpressServer } from 'navient-services-common/lib/utils/rest-helper';
import { redisClientPool } from './globals';
import { makeRestEndpoints } from './app';
import { patchDb } from 'navient-services-common/lib/utils/db-patcher';
import { DbInstanceManager } from 'navient-services-common/lib/utils/db-instance-manager';
import { GlobalConfigDb } from 'navient-services-common/lib/db/global-config-db';
import { ConnectInstanceServiceManager } from 'navient-services-common/lib/utils/connect-helper';

const logger = Logger.getLogger();
process.on('unhandledRejection', (error) => {
  logger.mlog('error', ['Unhandled promise rejection', error]);
});

async function start() {
  if (serviceConfig.dev.skipAuthCheck) {
    logger.log('warn', 'Auth checks are disabled and this API is open. This should only be used for development. (dev.skipAuthCheck)');
  }
  if (serviceConfig.dev.devAdminToken) {
    logger.log('warn', 'A permanent admin token is set. This should only be used for development. (dev.devAdminToken)');
  }
  DbInstanceManager.init(redisClientPool);
  await patchDb(redisClientPool, serviceConfig.dbIntegrityCheck, serviceConfig);
  await ServiceManager.init(redisClientPool, serviceConfig.cluster, 'config_api');
  const globalDb = DbInstanceManager.getInstance().getDbInstance(GlobalConfigDb);
  await ConnectInstanceServiceManager.init(globalDb.cache, serviceConfig.awsCredentials);
  const app = await makeRestEndpoints();
  startExpressServer(serviceConfig.rest, serviceConfig.server, app);
}

start();
