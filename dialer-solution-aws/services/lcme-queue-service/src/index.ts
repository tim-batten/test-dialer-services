import "reflect-metadata"
import { serviceConfig } from "./config/config"
// Always init logger immediately before other imports (other than serviceConfig)
import { Logger } from "lcme-services-common/lib/logger/logger";
Logger.init(serviceConfig.logging)

import { ServiceManager } from "lcme-services-common/lib/utils/service-manager"
import { redisClientPool } from "./globals"

import { patchDb } from "lcme-services-common/lib/utils/db-patcher"
import { QueueManager } from "./queue-manager";
import { ConnectInstanceServiceManager } from 'lcme-services-common/lib/utils/connect-helper';
import { GlobalConfigDb } from 'lcme-services-common/lib/db/global-config-db';

const logger = Logger.getLogger()
process.on('unhandledRejection', error => {
    logger.mlog('error', ['Unhandled promise rejection', error])
});

async function start() {
    await patchDb(redisClientPool, serviceConfig.dbIntegrityCheck, serviceConfig)
    await ServiceManager.init(redisClientPool, serviceConfig.cluster, 'queue')
    await ConnectInstanceServiceManager.init(new GlobalConfigDb(redisClientPool).cache, serviceConfig.awsCredentials);
    const queueManager = new QueueManager()
    queueManager.start()
}

start()
