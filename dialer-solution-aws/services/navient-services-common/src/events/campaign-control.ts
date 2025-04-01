import { StreamEvent } from "./redis-stream-event"

export class StartCampaignEvent extends StreamEvent {
    static readonly EVENT_NAME = 'START_CAMPAIGN'
    constructor(public campaignExecutionId: string) {
        super(StartCampaignEvent.EVENT_NAME)
    }
}

export class StopCampaignEvent extends StreamEvent {
    static readonly EVENT_NAME = 'STOP_CAMPAIGN'
    constructor(public campaignExecutionId: string, public immediateReleaseCache: boolean = false) {
        super(StopCampaignEvent.EVENT_NAME)
    }
}

export class PauseCampaignEvent extends StreamEvent {
    static readonly EVENT_NAME = 'PAUSE_CAMPAIGN'
    constructor(public campaignExecutionId: string) {
        super(PauseCampaignEvent.EVENT_NAME)
    }
}

export class ResumeCampaignEvent extends StreamEvent {
    static readonly EVENT_NAME = 'RESUME_CAMPAIGN'
    constructor(public campaignExecutionId: string) {
        super(ResumeCampaignEvent.EVENT_NAME)
    }
}