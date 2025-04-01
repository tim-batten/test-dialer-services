import { Transform, Type } from "class-transformer"
import { transformAndValidateSync } from "class-transformer-validator"
import { IsInstance, IsInt, IsOptional, Min, ValidateNested } from "class-validator"
import { ClusterConfig } from "lcme-services-common/lib/config/cluster"
import { loadConfigObject } from 'lcme-services-common/lib/config/config-loader'
import { DbConfig } from 'lcme-services-common/lib/config/db-config'
import { AwsCredentialsConfig } from 'lcme-services-common/lib/config/aws-credentials-config';
import { DbIntegrityCheckOptions } from "lcme-services-common/lib/config/db-integrity-check"
import { HostConfig } from 'lcme-services-common/lib/config/host-config'
import { LogConfig } from 'lcme-services-common/lib/config/log-config'
import { RestConfig } from 'lcme-services-common/lib/config/rest-config'
import { StreamGroupMonitorConfig } from 'lcme-services-common/lib/config/stream-group-monitor-config'
import { InputUnit, parseDuration } from 'lcme-common/lib/utils/duration-helper'
import { defaultConfigTransformValidationOptions } from "lcme-common/lib/utils/validation"
import { Units } from 'parse-duration'
import { exit } from "process"

export function TransformDuration(defaultInputUnit: InputUnit, outputUnit: Units) {
  return Transform(({ value }) => parseDuration(defaultInputUnit, outputUnit, value), { toClassOnly: true });
}

export class StatsConfig {
    @IsInt()
    @Min(1000)
    statsCheckInterval: number = 5000
}

export class DispositionConfig {
  @TransformDuration(InputUnit.MILLISECOND, 'ms')
  @IsInt()
  @IsOptional()
  dispositionTimeout: number = 3600000;

  @TransformDuration(InputUnit.MILLISECOND, 'ms')
  @IsInt()
  @IsOptional()
  dispositionCheckFrequency: number = 5000;
}

export class Config {
  @ValidateNested()
  @IsInstance(DbConfig)
  @Type(() => DbConfig)
  @Transform(({ value }) => DbConfig.from(value), { toClassOnly: true })
  db!: DbConfig;

  @ValidateNested()
  @IsInstance(DbIntegrityCheckOptions)
  @Type(() => DbIntegrityCheckOptions)
  dbIntegrityCheck: DbIntegrityCheckOptions = new DbIntegrityCheckOptions();

  @ValidateNested()
  @IsInstance(ClusterConfig)
  @Type(() => ClusterConfig)
  @Transform(({ value }) => ClusterConfig.from(value), { toClassOnly: true })
  cluster!: ClusterConfig;

  @ValidateNested()
  @IsInstance(AwsCredentialsConfig)
  @Type(() => AwsCredentialsConfig)
  awsCredentials: AwsCredentialsConfig = new AwsCredentialsConfig();

  @ValidateNested()
  @IsInstance(RestConfig)
  @Type(() => RestConfig)
  @Transform(({ value }) => RestConfig.from(value), { toClassOnly: true })
  rest!: RestConfig;

  @ValidateNested()
  @IsOptional()
  @IsInstance(HostConfig)
  @Type(() => HostConfig)
  @Transform(({ value }) => HostConfig.from(value), { toClassOnly: true })
  server: HostConfig = new HostConfig();

  @ValidateNested()
  @IsInstance(StatsConfig)
  @Type(() => StatsConfig)
  @IsOptional()
  stats: StatsConfig = new StatsConfig();

  @ValidateNested()
  @IsInstance(DispositionConfig)
  @Type(() => DispositionConfig)
  @IsOptional()
  disposition: DispositionConfig = new DispositionConfig();

  @ValidateNested()
  @IsInstance(StreamGroupMonitorConfig)
  @Type(() => StreamGroupMonitorConfig)
  @Transform(({ value }) => StreamGroupMonitorConfig.from(value, 'stats_campaign_event_group'), { toClassOnly: true })
  campaignEventMonitor: StreamGroupMonitorConfig = StreamGroupMonitorConfig.from({}, 'stats_campaign_event_group');

  @ValidateNested()
  @IsInstance(LogConfig)
  @Type(() => LogConfig)
  @IsOptional()
  logging!: LogConfig;

  static load() {
    const plainConf = loadConfigObject('statsService', true);
    try {
      return transformAndValidateSync(Config, plainConf, defaultConfigTransformValidationOptions) as Config;
    } catch (e: any) {
      if (plainConf.configLoadError) {
        console.error(plainConf.configLoadError);
        exit();
      }
      throw e;
    }
  }
}

export const serviceConfig = Config.load()
