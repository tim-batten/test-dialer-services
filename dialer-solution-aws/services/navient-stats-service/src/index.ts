import 'reflect-metadata';
import { serviceConfig } from './config/config';
// Always init logger immediately before other imports (other than serviceConfig)
import { Logger } from 'navient-services-common/lib/logger/logger';
Logger.init(serviceConfig.logging);

import { ServiceManager } from 'navient-services-common/lib/utils/service-manager';
import { RedisClientPool } from 'navient-services-common/lib/db/redis-client-pool';
import { QueueStatsManager } from './stats-manager';
import { ConnectInstanceServiceManager } from 'navient-services-common/lib/utils/connect-helper';
import { CampaignEventStreamMonitor } from './db/campaign-event-monitor';
import { patchDb } from 'navient-services-common/lib/utils/db-patcher';
import { GlobalConfigDb } from 'navient-services-common/lib/db/global-config-db';
import { makeRestEndpoints } from './app';
import { startExpressServer } from 'navient-services-common/lib/utils/rest-helper';
import { DbInstanceManager } from 'navient-services-common/lib/utils/db-instance-manager';
import { ContactEventGenerator } from './dev/contact-event-generator';
import { ContactInfoDb } from 'navient-services-common/lib/db/contact-info-db';
import { ContactEventHandler } from './handlers/contact-event-handler';

const logger = Logger.getLogger();
process.on('unhandledRejection', (error) => {
  logger.mlog('error', ['Unhandled promise rejection', error]);
});

async function start() {
  const redisClientPool = new RedisClientPool(serviceConfig.db);
  DbInstanceManager.init(redisClientPool);
  await patchDb(redisClientPool, serviceConfig.dbIntegrityCheck, serviceConfig);
  await ServiceManager.init(redisClientPool, serviceConfig.cluster, 'stats');
  const dbInstanceManager = DbInstanceManager.getInstance();
  await ConnectInstanceServiceManager.init(
    dbInstanceManager.getDbInstance(GlobalConfigDb).cache,
    serviceConfig.awsCredentials
  );

  const queueStatsManager = new QueueStatsManager(redisClientPool, serviceConfig.stats.statsCheckInterval);
  const campaignEventMonitor = new CampaignEventStreamMonitor(redisClientPool, queueStatsManager);

  campaignEventMonitor.start(serviceConfig.campaignEventMonitor.consumerId);
  queueStatsManager.start();

  const contactEventHandler = new ContactEventHandler();

  if (serviceConfig.dev?.skipFlowExecution) {
    const contactEventGenerator = new ContactEventGenerator(dbInstanceManager.getDbInstance(ContactInfoDb), contactEventHandler, {
      outcomes: {
        NO_ANSWER: 0.1,
        BUSY: 0.1,
        MACHINE: 0.1,
        ABANDONED_IVR: 0.1,
        ABANDONED_QUEUE: 0.1,
        CONNECTED_AGENT: 0.5,
      },
      ringTime: {
        min: 1000,
        max: 31000,
      },
      connectedTime: {
        min: 1000,
        max: 31000,
      },
    });
    contactEventGenerator.start();
  } else {
    const app = makeRestEndpoints(contactEventHandler);
    startExpressServer(serviceConfig.rest, serviceConfig.server, app);
  }
}

start();
