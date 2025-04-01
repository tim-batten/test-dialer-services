import 'reflect-metadata';
import { serviceConfig } from './config/config';
// Always init logger immediately before other imports (other than serviceConfig)
import { Logger } from 'lcme-services-common/lib/logger/logger';
import { startExpressServer } from 'lcme-services-common/lib/utils/rest-helper';

Logger.init(serviceConfig.logging);

import { ServiceManager } from 'lcme-services-common/lib/utils/service-manager';
import { RedisClientPool } from 'lcme-services-common/lib/db/redis-client-pool';
import { ScheduleManager } from './schedule-manager';
import { patchDb } from 'lcme-services-common/lib/utils/db-patcher';
import { ConnectInstanceServiceManager } from 'lcme-services-common/lib/utils/connect-helper';
import { GlobalConfigDb } from 'lcme-services-common/lib/db/global-config-db';
import { DbInstanceManager } from 'lcme-services-common/lib/utils/db-instance-manager';
import { CampaignManager } from './campaign-manager';
import { makeRestEndpoints } from './app';

const logger = Logger.getLogger();
process.on('unhandledRejection', (error) => {
  logger.mlog('error', ['Unhandled promise rejection', error]);
});

async function start() {
  const redisClientPool = new RedisClientPool(serviceConfig.db);
  DbInstanceManager.init(redisClientPool);
  await patchDb(redisClientPool, serviceConfig.dbIntegrityCheck, serviceConfig);
  await ServiceManager.init(redisClientPool, serviceConfig.cluster, 'campaign_manager');
  const globalDb = DbInstanceManager.getInstance().getDbInstance(GlobalConfigDb);
  await ConnectInstanceServiceManager.init(globalDb.cache, serviceConfig.awsCredentials);
  const scheduleManager = new ScheduleManager(redisClientPool);
  await scheduleManager.initialise();
  const campaignManager = new CampaignManager(redisClientPool);
  const app = makeRestEndpoints(campaignManager.cacheManager);
  startExpressServer(serviceConfig.rest, serviceConfig.server, app);

  campaignManager.start();
}
start();
