import 'reflect-metadata';
import { serviceConfig } from './config/config';
// Always init logger immediately before other imports (other than serviceConfig)
import { Logger } from 'lcme-services-common/lib/logger/logger';
Logger.init(serviceConfig.logging);

import { ServiceManager } from 'lcme-services-common/lib/utils/service-manager';
import { RedisClientPool } from 'lcme-services-common/lib/db/redis-client-pool';
import { QueueStatsManager } from './stats-manager';
import { ConnectInstanceServiceManager } from 'lcme-services-common/lib/utils/connect-helper';
import { CampaignEventStreamMonitor } from './db/campaign-event-monitor';
import { patchDb } from 'lcme-services-common/lib/utils/db-patcher';
import { GlobalConfigDb } from 'lcme-services-common/lib/db/global-config-db';
import { makeRestEndpoints } from './app';
import { startExpressServer } from 'lcme-services-common/lib/utils/rest-helper';
import { DbInstanceManager } from 'lcme-services-common/lib/utils/db-instance-manager';

const logger = Logger.getLogger();
process.on('unhandledRejection', (error) => {
  logger.mlog('error', ['Unhandled promise rejection', error]);
});

async function start() {
  const redisClientPool = new RedisClientPool(serviceConfig.db);
  DbInstanceManager.init(redisClientPool);
  await patchDb(redisClientPool, serviceConfig.dbIntegrityCheck, serviceConfig);
  await ServiceManager.init(redisClientPool, serviceConfig.cluster, 'stats');
  await ConnectInstanceServiceManager.init(
    DbInstanceManager.getInstance().getDbInstance(GlobalConfigDb).cache,
    serviceConfig.awsCredentials
  );

  const queueStatsManager = new QueueStatsManager(redisClientPool, serviceConfig.stats.statsCheckInterval);
  const campaignEventMonitor = new CampaignEventStreamMonitor(redisClientPool, queueStatsManager);

  const app = makeRestEndpoints();
  startExpressServer(serviceConfig.rest, serviceConfig.server, app);

  campaignEventMonitor.start(serviceConfig.campaignEventMonitor.consumerId);
  queueStatsManager.start();
}

start();
