import { IsOptional, IsString } from 'class-validator';

export class AwsCredentialsConfig {
    @IsString()
    accessKeyId: string = process.env.AWS_ACCESS_KEY_ID!;

    @IsString()
    secretAccessKey: string = process.env.AWS_SECRET_ACCESS_KEY!;

    @IsString()
    @IsOptional()
    sessionToken?: string = process.env.AWS_SESSION_TOKEN;
}