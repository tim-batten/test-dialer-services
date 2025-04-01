import { RedisClientPool } from "navient-services-common/lib/db/redis-client-pool"
import { RedisStreamPublisher } from "navient-services-common/lib/db/redis-stream-publisher"
import { CampaignExecutionCompleteEvent, CampaignExecutionStartedEvent, CampaignExecutionStartingEvent, CampaignExecutionFailedEvent, CampaignExecutionFinalisedEvent } from 'navient-services-common/lib/events/campaign-event'

export class CampaignEventStreamPublisher extends RedisStreamPublisher {
    constructor(redisClientPool: RedisClientPool) {
        super(redisClientPool, 'campaign_event_stream')
    }
    
    public async campaignExecutionComplete(campaignExecutionId: string) {
        this.addToStream(new CampaignExecutionCompleteEvent(campaignExecutionId))
    }
        
    public async campaignExecutionFinalised(campaignExecutionId: string) {
        this.addToStream(new CampaignExecutionFinalisedEvent(campaignExecutionId))
    }

    public async campaignExecutionStarting(campaignExecutionId: string) {
        this.addToStream(new CampaignExecutionStartingEvent(campaignExecutionId))
    }

    public async campaignExecutionStarted(campaignExecutionId: string) {
        this.addToStream(new CampaignExecutionStartedEvent(campaignExecutionId))
    }

    campaignExecutionFailed(campaignExecutionId: string, reason: string) {
        this.addToStream(new CampaignExecutionFailedEvent(campaignExecutionId, reason))
    }
}