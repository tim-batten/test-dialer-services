import { RedisClientPool } from 'navient-services-common/lib/db/redis-client-pool';
import { RedisStreamPublisher } from 'navient-services-common/lib/db/redis-stream-publisher'
import { ScheduleControl, ScheduleControlEvent } from 'navient-services-common/lib/events/schedule-control'

export class ScheduleControlStreamPublisher extends RedisStreamPublisher {

    constructor(redisClientPool: RedisClientPool) {
        super(redisClientPool, 'schedule_control_stream')
    }

    public scheduleControl(scheduleControls: ScheduleControl[]) {
        return this.addToStream(new ScheduleControlEvent(scheduleControls))
    }
}