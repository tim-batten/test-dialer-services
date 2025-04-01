import { CampaignConfigDb } from "lcme-services-common/lib/db/campaign-config-db";
import { CampaignExecutionDb } from "lcme-services-common/lib/db/campaign-execution-db";
import { ContactListConfigDb } from "lcme-services-common/lib/db/contact-list-config-db";
import { FilterConfigDb } from "lcme-services-common/lib/db/filter-config-db";
import { GlobalConfigDb } from "lcme-services-common/lib/db/global-config-db";
import { PacingStatsDb } from "lcme-services-common/lib/db/pacing-stats-db";
import { RedisChannelPublisher } from "lcme-services-common/lib/db/redis-channel-publisher";
import { RedisClientPool } from "lcme-services-common/lib/db/redis-client-pool";
import { ScheduleConfigDb } from "lcme-services-common/lib/db/schedule-config-db";
import { HolidayDb } from "lcme-services-common/lib/db/holiday-db";
import { CampaignGroupConfigDb } from "lcme-services-common/lib/db/campaign-group-config-db";
import { ScheduleExecutionDb } from "lcme-services-common/lib/db/schedule-execution-db";
import { serviceConfig } from './config/config'
import { CampaignConfigManager } from "./managers/campaign-config-manager";
import { CampaignStatsRetriever } from "./managers/campaign-stats-retriever";
import { ContactListConfigManager } from "./managers/contact-list-config-manager";
import { FilterConfigManager } from "./managers/filter-config-manager";
import { GlobalConfigManager } from "./managers/global-config-manager";
import { ScheduleConfigManager } from "./managers/schedule-config-manager";
import { ScheduleControlStreamPublisher } from './db/schedule-control-stream-publisher'
import { HolidayConfigManager } from "./managers/holiday-manager";
import { CampaignGroupConfigManager } from "./managers/campaign-group-config-manager";
import { EntityRelationshipDb } from "lcme-services-common/lib/db/entity-relationship-db";

export const redisClientPool = new RedisClientPool(serviceConfig.db)
export const entityRelationshipDb = new EntityRelationshipDb(redisClientPool)
export const globalConfigDb = new GlobalConfigDb(redisClientPool)
export const campaignConfigDb = new CampaignConfigDb(redisClientPool)
export const campaignGroupConfigDb = new CampaignGroupConfigDb(redisClientPool)
export const scheduleConfigDb = new ScheduleConfigDb(redisClientPool)
export const holidayDb = new HolidayDb(redisClientPool)
export const contactListConfigDb = new ContactListConfigDb(redisClientPool)
export const filterConfigDb = new FilterConfigDb(redisClientPool)
export const campaignExecutionDb = new CampaignExecutionDb(redisClientPool)
export const scheduleExecutionDb = new ScheduleExecutionDb(redisClientPool)
export const pacingStatsDb = new PacingStatsDb(redisClientPool)

export const scheduleUpdatePublisherDb = new RedisChannelPublisher(redisClientPool, 'schedule_config_events')

export const scheduleControlStreamPublisher = new ScheduleControlStreamPublisher(redisClientPool)

export const scheduleManager = new ScheduleConfigManager()
export const holidayManager = new HolidayConfigManager()
export const campaignManager = new CampaignConfigManager()
export const campaignGroupConfigManager = new CampaignGroupConfigManager()
export const globalConfigManager = new GlobalConfigManager()
export const contactListConfigManager = new ContactListConfigManager()
export const filterConfigManager = new FilterConfigManager()
export const campaignStatsRetriever = new CampaignStatsRetriever()
