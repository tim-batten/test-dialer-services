import { Transform, TransformFnParams, TransformOptions, Type } from 'class-transformer';
import { IsBoolean, IsInstance, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { transformAndValidateSync } from 'class-transformer-validator';
import { Units } from 'parse-duration';

import { DbConfig } from 'navient-services-common/lib/config/db-config';
import { LogConfig } from 'navient-services-common/lib/config/log-config';
import { StreamGroupMonitorConfig } from 'navient-services-common/lib/config/stream-group-monitor-config';
import { AwsCredentialsConfig } from 'navient-services-common/lib/config/aws-credentials-config';
import { loadConfigObject } from 'navient-services-common/lib/config/config-loader';
import { defaultConfigTransformValidationOptions } from 'navient-common/lib/utils/validation';
import { ApiCertificateConfig } from 'navient-services-common/lib/config/navient-api-certificate-config';
import { HostConfig } from 'navient-services-common/lib/config/host-config';
import { exit } from 'process';
import { ClusterConfig } from 'navient-services-common/lib/config/cluster';
import { RestConfig } from 'navient-services-common/lib/config/rest-config';
import { CrudApiConfig } from 'navient-services-common/lib/config/navient-crud-api-config';
import { InputUnit, parseDuration } from 'navient-common/lib/utils/duration-helper';
import { DbIntegrityCheckOptions } from 'navient-services-common/lib/config/db-integrity-check';

export function TransformDuration(defaultInputUnit: InputUnit, outputUnit: Units) {
  return Transform(({ value }) => parseDuration(defaultInputUnit, outputUnit, value), { toClassOnly: true });
}

export class DevConfig {
  @IsBoolean()
  @IsOptional()
  clearLastOccurrenceDatesOnStart = false;

  @IsBoolean()
  @IsOptional()
  clearExecutionsOnStart = false;

  @IsBoolean()
  @IsOptional()
  skipSendScheduleExecStatus = false;

  @IsBoolean()
  @IsOptional()
  skipCacheSend = false;

  @IsNumber()
  @IsOptional()
  cachedRecords = 100;

  @IsInt()
  @TransformDuration(InputUnit.MILLISECOND, 'ms')
  cacheResponseDelay: number = 5000;
}

export class CacheApiConfig {
  @IsString()
  cacheApiUrl!: string;

  @IsString()
  cacheReleaseUrl!: string;
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
  @IsOptional()
  @IsInstance(HostConfig)
  @Type(() => HostConfig)
  @Transform(({ value }) => HostConfig.from(value), { toClassOnly: true })
  server: HostConfig = new HostConfig();

  @ValidateNested()
  @IsInstance(CrudApiConfig)
  @Type(() => CrudApiConfig)
  @Transform(({ value }) => CrudApiConfig.from(value), { toClassOnly: true })
  crudApi!: CrudApiConfig;

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
  @IsInstance(StreamGroupMonitorConfig)
  @Type(() => StreamGroupMonitorConfig)
  @Transform(({ value }) => StreamGroupMonitorConfig.from(value, 'schedule_campaign_event_group'), {
    toClassOnly: true,
  })
  @IsOptional()
  campaignEventMonitor: StreamGroupMonitorConfig = StreamGroupMonitorConfig.from({}, 'schedule_campaign_event_group');

  @ValidateNested()
  @IsInstance(StreamGroupMonitorConfig)
  @Type(() => StreamGroupMonitorConfig)
  @Transform(({ value }) => StreamGroupMonitorConfig.from(value, 'campaign_control_group'), { toClassOnly: true })
  campaignControlMonitor: StreamGroupMonitorConfig = StreamGroupMonitorConfig.from({}, 'campaign_control_group');

  @ValidateNested()
  @IsInstance(StreamGroupMonitorConfig)
  @Type(() => StreamGroupMonitorConfig)
  @Transform(({ value }) => StreamGroupMonitorConfig.from(value, 'queue_event_group'), { toClassOnly: true })
  queueEventMonitor: StreamGroupMonitorConfig = StreamGroupMonitorConfig.from({}, 'queue_event_group');

  @ValidateNested()
  @IsInstance(CacheApiConfig)
  @Type(() => CacheApiConfig)
  cacheApi!: CacheApiConfig;

  @ValidateNested()
  @IsInstance(StreamGroupMonitorConfig)
  @Type(() => StreamGroupMonitorConfig)
  @Transform(({ value }) => StreamGroupMonitorConfig.from(value, 'schedule_control_monitor_group'), {
    toClassOnly: true,
  })
  @IsOptional()
  scheduleControlMonitor: StreamGroupMonitorConfig = StreamGroupMonitorConfig.from(
    {},
    'schedule_control_monitor_group'
  );

  @ValidateNested()
  @IsInstance(DevConfig)
  @Type(() => DevConfig)
  @IsOptional()
  dev: DevConfig = new DevConfig();

  @ValidateNested()
  @IsInstance(LogConfig)
  @Type(() => LogConfig)
  @IsOptional()
  logging!: LogConfig;

  @ValidateNested()
  @IsInstance(ApiCertificateConfig)
  @Type(() => ApiCertificateConfig)
  @Transform(({ value }) => ApiCertificateConfig.from(value), { toClassOnly: true })
  apiCertificate!: ApiCertificateConfig;

  @TransformDuration(InputUnit.SECOND, 'second')
  @IsInt()
  @Min(0)
  scheduleExecutionExpiryOffset: number = 600;

  @TransformDuration(InputUnit.SECOND, 'second')
  @IsInt()
  @Min(0)
  campaignExecutionExpiryOffset: number = 600;
  @IsInt()
  scheduleServiceAppNameID!: number;

  @IsInt()
  cacheReleaseAppNameId!: number;

  @IsInt()
  cacheBuildAppNameId!: number;

  @IsInt()
  @TransformDuration(InputUnit.MILLISECOND, 'ms')
  postbackWaitWindow: number = 120000;

  static load() {
    const plainConf = loadConfigObject('campaignManagerService', true);
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

export const serviceConfig = Config.load();
