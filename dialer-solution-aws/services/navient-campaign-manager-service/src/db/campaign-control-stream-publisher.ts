import { RedisStreamPublisher } from "navient-services-common/lib/db/redis-stream-publisher";
import { RedisClientPool } from "navient-services-common/lib/db/redis-client-pool"
import { PauseCampaignEvent, ResumeCampaignEvent, StartCampaignEvent, StopCampaignEvent } from 'navient-services-common/lib/events/campaign-control'

export class CampaignControlStreamPublisher extends RedisStreamPublisher {
    constructor(redisClientPool: RedisClientPool) {
        super(redisClientPool, 'campaign_control_stream')
    }
    
    public async startCampaign(campaignExecutionId: string) {
        this.addToStream(new StartCampaignEvent(campaignExecutionId))
    }

    public async stopCampaign(campaignExecutionId: string, immediateReleaseCache: boolean = false) {
        this.addToStream(new StopCampaignEvent(campaignExecutionId))
    }

    public async pauseCampaign(campaignExecutionId: string) {
        this.addToStream(new PauseCampaignEvent(campaignExecutionId))
    }

    public async resumeCampaign(campaignExecutionId: string) {
        this.addToStream(new ResumeCampaignEvent(campaignExecutionId))
    }

}