import { StreamEvent } from "./redis-stream-event"

export class CampaignExecutionStartingEvent extends StreamEvent {
    static readonly EVENT_NAME = 'CAMPAIGN_EXECUTION_STARTING'
    constructor(public campaignExecutionId: string) {
        super(CampaignExecutionStartingEvent.EVENT_NAME)
    }
}

export class CampaignExecutionStartedEvent extends StreamEvent {
    static readonly EVENT_NAME = 'CAMPAIGN_EXECUTION_STARTED'
    constructor(public campaignExecutionId: string) {
        super(CampaignExecutionStartedEvent.EVENT_NAME)
    }
}

export class CampaignExecutionCompleteEvent extends StreamEvent {
    static readonly EVENT_NAME = 'CAMPAIGN_EXECUTION_COMPLETE'
    constructor(public campaignExecutionId: string) {
        super(CampaignExecutionCompleteEvent.EVENT_NAME)
    }
}

export class CampaignExecutionFinalisedEvent extends StreamEvent {
    static readonly EVENT_NAME = 'CAMPAIGN_EXECUTION_FINALISED'
    constructor(public campaignExecutionId: string) {
        super(CampaignExecutionFinalisedEvent.EVENT_NAME)
    }
}

export class CampaignExecutionFailedEvent extends StreamEvent {
    static readonly EVENT_NAME = 'CAMPAIGN_EXECUTION_FAILED'
    reason: string

    constructor(public campaignExecutionId: string, reason: string) {
        super(CampaignExecutionFailedEvent.EVENT_NAME)
        this.reason = reason
    }
}