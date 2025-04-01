import { RedisClientPool } from 'navient-services-common/lib/db/redis-client-pool';
import { RedisStreamPublisher } from 'navient-services-common/lib/db/redis-stream-publisher'
import { QueueCompleteEvent, QueueExpiredEvent, QueueFailedEvent, QueueFinalisedEvent } from 'navient-services-common/lib/events/queue-event'

export class QueueEventStreamPublisher extends RedisStreamPublisher {

    constructor(redisClientPool: RedisClientPool) {
        super(redisClientPool, 'queue_event_stream')
    }

    public queueComplete(campaignExecutionId: string) {
        this.addToStream(new QueueCompleteEvent(campaignExecutionId))
    }
    
    public queueFinalised(campaignExecutionId: string) {
        this.addToStream(new QueueFinalisedEvent(campaignExecutionId))
    }
    
    public queueExpired(campaignExecutionId: string) {
        this.addToStream(new QueueExpiredEvent(campaignExecutionId))
    }
        
    public queueFailed(campaignExecutionId: string, reason: string) {
        this.addToStream(new QueueFailedEvent(campaignExecutionId, reason))
    }
}