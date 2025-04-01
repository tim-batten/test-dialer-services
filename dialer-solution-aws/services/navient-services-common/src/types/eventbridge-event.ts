import { Type } from 'class-transformer';
import { IsDate, IsObject, IsOptional, IsString } from 'class-validator';

export class EventBridgeEvent {
    @IsString()
    version!: string;

    @IsString()
    id!: string;

    @IsString()
    'detail-type'!: string;

    @IsString()
    source!: string;

    @IsString()
    account!: string;

    @IsDate()
    @Type(() => Date)
    time!: string;

    @IsString()
    region!: string;

    @IsString({
        each: true
    })
    resources!: string[];

    @IsObject()
    detail: any;
}