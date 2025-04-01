import { Transform, Type } from "class-transformer";
import { transformAndValidateSync } from "class-transformer-validator";
import { IsEnum, IsInstance, IsInt, IsObject, IsOptional, IsString, Max, Min, ValidateIf, ValidateNested, ValidationOptions } from "class-validator";
import { CampaignPacingDefinition } from "lcme-common/lib/models/campaign";
import { defaultCRUDTransformValidationOptions } from "lcme-common/lib/utils/validation";
import { StreamEvent } from "./redis-stream-event";
import { Transformable } from 'lcme-common/lib/models/db-entity';

export enum ScheduleControlAction {
    RESUME = 'RESUME',
    STOP = 'STOP',
    PAUSE = 'PAUSE',
    UPDATE_RUNTIME_PARAMETERS = 'UPDATE_RUNTIME_PARAMETERS',
    SKIP_SEQUENCE = 'SKIP_SEQUENCE'
}

export class UpdateRuntimeParametersDefinition extends Transformable {
    @ValidateIf((obj) => obj.action === ScheduleControlAction.UPDATE_RUNTIME_PARAMETERS)
    @Type(() => CampaignPacingDefinition)
    // Seems odd doing this but it was the only way I could get partial pacing definition to work
    // - had no luck with validation groups
    @Transform(({ value }) => transformAndValidateSync(CampaignPacingDefinition, value, {
        transformer: defaultCRUDTransformValidationOptions.transformer,
        validator: {
            ...defaultCRUDTransformValidationOptions.validator,
            skipMissingProperties: true
        }
    }), { toClassOnly: true })
    pacing?: CampaignPacingDefinition

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    weight?: number

    @IsOptional()
    @IsInt()
    @Min(1)
    duration?: number
}

export class ScheduleControl extends Transformable {
    @IsEnum(ScheduleControlAction)
    action!: ScheduleControlAction

    @IsString()
    @ValidateIf((obj) => !obj.scheduleExecutionId)
    scheduleId?: string

    @IsOptional()
    @IsString()
    occurrence?: string

    @IsString()
    @ValidateIf((obj) => !obj.scheduleId)
    scheduleExecutionId?: string

    @ValidateIf((obj) => obj.action === ScheduleControlAction.UPDATE_RUNTIME_PARAMETERS)
    @IsInstance(UpdateRuntimeParametersDefinition)
    @Type(() => UpdateRuntimeParametersDefinition)
    @ValidateNested()
    runtimeParameters?: UpdateRuntimeParametersDefinition

    static from(scheduleControlObj: object) {
        return transformAndValidateSync(ScheduleControl, scheduleControlObj, defaultCRUDTransformValidationOptions)
    }
}

export class ScheduleControlEvent extends StreamEvent {
    static readonly EVENT_NAME = 'SCHEDULE_CONTROL'
    scheduleControlsJSON: string
    constructor(scheduleControls: ScheduleControl[]) {
        super(ScheduleControlEvent.EVENT_NAME)
        this.scheduleControlsJSON = JSON.stringify(scheduleControls)
    }

}