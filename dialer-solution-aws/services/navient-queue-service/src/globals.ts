import { CampaignExecutionDb } from "navient-services-common/lib/db/campaign-execution-db";
import { JobManagerDb } from "navient-services-common/lib/db/job-manager-db"
import { GlobalConfigDb } from "navient-services-common/lib/db/global-config-db";
import { PacingStatsDb } from "navient-services-common/lib/db/pacing-stats-db";
import { RedisClientPool } from "navient-services-common/lib/db/redis-client-pool";
import { CacheFetcher } from "./cache-fetcher";
import { serviceConfig } from './config/config';

export const redisClientPool = new RedisClientPool(serviceConfig.db)
const globalConfigDb = new GlobalConfigDb(redisClientPool)
export const globalConfigCache = globalConfigDb.cache
export const campaignExecutionDb = new CampaignExecutionDb(redisClientPool)
export const pacingStatsDb = new PacingStatsDb(redisClientPool)
export const jobManagerDb = new JobManagerDb(redisClientPool)

export const cacheFetcher = new CacheFetcher()
