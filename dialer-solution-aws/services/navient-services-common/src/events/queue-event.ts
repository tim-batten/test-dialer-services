import { StreamEvent } from "./redis-stream-event"

export class QueueCompleteEvent extends StreamEvent {
    static readonly EVENT_NAME = 'QUEUE_COMPLETE'
    constructor(public campaignExecutionId: string) {
        super(QueueCompleteEvent.EVENT_NAME)
    }
}

export class QueueFinalisedEvent extends StreamEvent {
    static readonly EVENT_NAME = 'QUEUE_FINALISED'
    constructor(public campaignExecutionId: string) {
        super(QueueFinalisedEvent.EVENT_NAME)
    }
}

export class QueueExpiredEvent extends StreamEvent {
    static readonly EVENT_NAME = 'QUEUE_EXPIRED'
    constructor(public campaignExecutionId: string) {
        super(QueueExpiredEvent.EVENT_NAME)
    }
}

export class QueueFailedEvent extends StreamEvent {
    static readonly EVENT_NAME = 'QUEUE_FAILED'
    constructor(public campaignExecutionId: string, public reason: string) {
        super(QueueFailedEvent.EVENT_NAME)
    }
}