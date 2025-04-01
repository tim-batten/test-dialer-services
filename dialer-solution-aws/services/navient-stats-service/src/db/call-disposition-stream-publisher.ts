import { RedisClientPool } from "navient-services-common/lib/db/redis-client-pool";
import { RedisStreamPublisher } from "navient-services-common/lib/db/redis-stream-publisher";
import { OutboundContactInfo } from 'navient-common/lib/models/outbound-contact-info';

export class CallDispositionStreamPublisher extends RedisStreamPublisher {

    constructor(redisClientPool: RedisClientPool) {
        super(redisClientPool, 'call_dispositions')
    }

    addOutboundContactInfo(outboundContactInfo: OutboundContactInfo) {
        return this.addToStream(outboundContactInfo)
    }
    
}