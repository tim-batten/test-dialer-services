import { plainToClass } from "class-transformer"
import { IsInt, IsOptional, IsString, Min } from "class-validator"

export class StreamGroupMonitorConfig {
    @IsString()
    @IsOptional()
    consumerGroup!: string

    @IsOptional()
    @IsInt()
    @Min(0)
    consumerId: number = 1

    static from(plain: object, defaultConsumerGroup: string) {
        const toReturn = plainToClass(StreamGroupMonitorConfig, plain)
        if (!toReturn.consumerGroup) {
            toReturn.consumerGroup = defaultConsumerGroup
        }
        return toReturn
    }
}