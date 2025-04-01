import { ChainableCommander } from 'ioredis';
import { CampaignExecutionDb } from '../db/campaign-execution-db';
import { PacingStatsDb } from '../db/pacing-stats-db';
import { CampaignDefinition } from 'navient-common/lib/models/campaign';
import { CampaignExecutionDefinition } from 'navient-common/lib/models/campaign-execution';

export async function clearStatsForCampaign(
  campaign: CampaignDefinition,
  statsDb: PacingStatsDb,
  pipeline?: ChainableCommander
) {
    await statsDb.removeStatsForQueueConnectCampaign(campaign.BaseConfig.Queue!, campaign.ConnectCampaignId, pipeline);
}

export async function clearStatsForCampaignExecution(
  campaignExecution: CampaignExecutionDefinition,
  campaignExecutionDb: CampaignExecutionDb,
) {
  await campaignExecutionDb.setStatsFromTime(campaignExecution, new Date());
}
