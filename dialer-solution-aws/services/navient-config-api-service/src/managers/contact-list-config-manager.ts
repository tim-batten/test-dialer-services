import { RedisClientPool } from "navient-services-common/lib/db/redis-client-pool";
import { GenericEntityManager } from "./generic-entity-manager";
import { ContactListDefinition } from "navient-common/lib/models/contact-list";
import { ContactListConfigDb } from "navient-services-common/lib/db/contact-list-config-db"
import { CampaignConfigDb } from "navient-services-common/lib/db/campaign-config-db";
import { campaignConfigDb, contactListConfigDb } from '../globals'
import { CampaignDefinition } from "navient-common/lib/models/campaign";

export class ContactListConfigManager extends GenericEntityManager<ContactListDefinition> {
    constructor() {
        super(contactListConfigDb)
    }

    public async getDependents(entityDefinition: ContactListDefinition) {
        const dependentCampiagnIds = await contactListConfigDb.getRelatedEntitiesOfType(
          entityDefinition.id,
          CampaignDefinition.ENTITY_TYPE,
          {
            filterNull: true,
          }
        );
        const dependentCampaigns = await campaignConfigDb.mgetList(dependentCampiagnIds || [])
        if (dependentCampaigns.length === 0) {
            return
        }
        return {
            cascadeDeletable: false,
            dependents: {
                campaigns: dependentCampaigns.map((campaign) => {
                    return {
                        campaignId: campaign.id,
                        campaignName: campaign.CampaignName
                    }
                })
            }
        }
    }
}