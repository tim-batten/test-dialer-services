import { IsOptional, IsString } from 'class-validator';

export class CorsConfig {
    @IsString()
    @IsOptional()
    origin: string = '*'
}