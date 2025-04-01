import { StreamEvent } from "./redis-stream-event"

export class StartQueueEvent extends StreamEvent {
    static readonly EVENT_NAME = 'START_QUEUE'
    constructor(public cacheEventActionsId: number, public cachedRecords: number, public campaignExecutionId: string) {
        super(StartQueueEvent.EVENT_NAME)
    }
}

export class StopQueueEvent extends StreamEvent {
    static readonly EVENT_NAME = 'STOP_QUEUE'
    constructor(public campaignExecutionId: string) {
        super(StopQueueEvent.EVENT_NAME)
    }
}