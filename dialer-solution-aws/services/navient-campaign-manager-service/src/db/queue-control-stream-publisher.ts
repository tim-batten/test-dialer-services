import { RedisClientPool } from "navient-services-common/lib/db/redis-client-pool"
import { RedisStreamPublisher } from "navient-services-common/lib/db/redis-stream-publisher"
import { StartQueueEvent, StopQueueEvent } from 'navient-services-common/lib/events/queue-control'

export class QueueControlStreamPublisher extends RedisStreamPublisher {

    constructor(redisClientPool: RedisClientPool) {
        super(redisClientPool, 'queue_control_stream')
    }
    
    public async startQueue(cacheEventActionsId: number, cachedRecords: number, campaignExecutionId: string) {
        this.logger.mlog('info', ['STARTING QUEUE for ', cacheEventActionsId, campaignExecutionId], { entityId: campaignExecutionId })
        this.addToStream(new StartQueueEvent(cacheEventActionsId, cachedRecords, campaignExecutionId))
    }

    public async stopQueue(campaignExecutionId: string) {
        this.addToStream(new StopQueueEvent(campaignExecutionId))
    }

}