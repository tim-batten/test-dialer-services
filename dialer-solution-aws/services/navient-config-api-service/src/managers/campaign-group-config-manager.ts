import { ChainableCommander } from 'ioredis';
import { CampaignDefinition } from 'navient-common/lib/models/campaign';
import { CampaignGroupDefinition } from 'navient-common/lib/models/campaign-group';
import { campaignConfigDb, campaignGroupConfigDb } from '../globals';
import { DependentsInfo } from './entity-manager';
import { GenericEntityManager } from './generic-entity-manager';

export class CampaignGroupConfigManager extends GenericEntityManager<CampaignGroupDefinition> {
  constructor() {
    super(campaignGroupConfigDb);
  }

  public async getDependents(entity: CampaignGroupDefinition): Promise<DependentsInfo | undefined> {
    const dependentIds = await this.getCampaignIds(entity.id);
    const dependentCampaigns = await campaignConfigDb.mgetList(dependentIds);
    if (dependentCampaigns.length === 0) {
      return;
    }
    return {
      cascadeDeletable: false,
      dependents: {
        campaigns: dependentCampaigns.map((campaign) => {
          return {
            campaignId: campaign.id,
            campaignName: campaign.CampaignName,
          };
        }),
      },
    };
  }

  public async getCampaignIds(groupId: string, pipeline?: ChainableCommander) {
    return (
      (await campaignGroupConfigDb.getRelatedEntitiesOfType(groupId, CampaignDefinition.ENTITY_TYPE, {
        filterNull: true,
        pipeline,
      })) || []
    );
  }
}
