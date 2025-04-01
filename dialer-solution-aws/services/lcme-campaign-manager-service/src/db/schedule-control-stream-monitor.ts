import { RedisClientPool } from "lcme-services-common/lib/db/redis-client-pool"
import { RedisStreamGroupEventMonitor } from "lcme-services-common/lib/db/redis-stream-event-monitor"
import { serviceConfig } from '../config/config'
import { ScheduleControl, ScheduleControlEvent } from 'lcme-services-common/lib/events/schedule-control'
import { ScheduleExecutionManager } from "../schedule-execution-manager"

export class ScheduleControlStreamMonitor extends RedisStreamGroupEventMonitor {

    constructor(redisClientPool: RedisClientPool, private scheduleExecutionManager: ScheduleExecutionManager) {
        super(redisClientPool, 'schedule_control_stream', serviceConfig.scheduleControlMonitor.consumerGroup)
        this.addEventHandler(ScheduleControlEvent.EVENT_NAME, this, this.handleScheduleControl)
    }

    private async handleScheduleControl(messageId: number, scheduleControlEvent: ScheduleControlEvent, receivedAt: Date) {
        const scheduleControls = ScheduleControl.from(JSON.parse(scheduleControlEvent.scheduleControlsJSON))
        if (Array.isArray(scheduleControls)) {
            scheduleControls.forEach((scheduleControl) => {
                this.scheduleExecutionManager.handleControlEvent(scheduleControl)
            })
        } else {
            this.scheduleExecutionManager.handleControlEvent(scheduleControls)
        }
    }
}