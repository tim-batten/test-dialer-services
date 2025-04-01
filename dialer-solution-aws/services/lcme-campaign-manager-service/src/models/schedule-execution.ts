import { DbEntity, Transformable } from 'lcme-common/lib/models/db-entity'

export enum ScheduleExecutionStatus {
    STOPPED,
    STARTING,
    RUNNING,
    PAUSED
}

export class ScheduleExecutionDefinition extends Transformable implements DbEntity {
    id: string = ''
    scheduleId: string
    endBy: number
    currentSequenceId?: string
    status?: ScheduleExecutionStatus

    constructor(scheduleId: string, endBy: number, id: string) {
        super()
        this.scheduleId = scheduleId
        this.endBy = endBy
        this.id = id
    }

    public getEndByDate() {
        return new Date(this.endBy)
    }
    
    public getRelatedEntities() {
        return []
    }

    static from(obj: any) {
        return Object.assign(ScheduleExecutionDefinition, obj)
    }
}