import { RedisGenericJsonEntityDb } from "./redis-generic-json-entity-db";
import { RedisClientPool } from "./redis-client-pool";
import { CampaignGroupDefinition } from "navient-common/lib/models/campaign-group";


export class CampaignGroupConfigDb extends RedisGenericJsonEntityDb<CampaignGroupDefinition> {

    constructor(redisClientPool: RedisClientPool) {
        super(redisClientPool, CampaignGroupDefinition.ENTITY_TYPE, CampaignGroupDefinition.from)
    }
}