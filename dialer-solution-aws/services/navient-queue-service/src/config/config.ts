import { Transform, Type } from "class-transformer";
import { transformAndValidateSync } from "class-transformer-validator";
import {
  IsBoolean,
  IsInstance,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested
} from "class-validator";
import { Units } from "parse-duration";

import { AwsCredentialsConfig } from 'navient-services-common/lib/config/aws-credentials-config';
import { ClusterConfig } from "navient-services-common/lib/config/cluster";
import { loadConfigObject } from "navient-services-common/lib/config/config-loader";
import { DbConfig } from "navient-services-common/lib/config/db-config";
import { DbIntegrityCheckOptions } from "navient-services-common/lib/config/db-integrity-check";
import { LogConfig } from "navient-services-common/lib/config/log-config";
import { ApiCertificateConfig } from "navient-services-common/lib/config/navient-api-certificate-config";
import { CrudApiConfig } from "navient-services-common/lib/config/navient-crud-api-config";
import { StreamGroupMonitorConfig } from "navient-services-common/lib/config/stream-group-monitor-config";
import { InputUnit, parseDuration } from "navient-common/lib/utils/duration-helper";
import { defaultConfigTransformValidationOptions } from "navient-common/lib/utils/validation";
import { exit } from "process";

export function TransformDuration(defaultInputUnit: InputUnit, outputUnit: Units) {
  return Transform(({ value }) => parseDuration(defaultInputUnit, outputUnit, value), { toClassOnly: true });
}

export class DevConfig {
  @IsBoolean()
  @IsOptional()
  skipCacheSend = false;

  @IsBoolean()
  @IsOptional()
  skipFlowExecution = false;

  @IsString()
  @IsOptional()
  destinationPhoneNumber?: string;

  @IsNumber()
  @IsOptional()
  totalCallLimit?: number;
}

export class QueueConfig {
  @IsInt()
  @TransformDuration(InputUnit.MILLISECOND, "ms")
  @IsOptional()
  enqueueFrequecy: number = 2000;

  @IsInt()
  @TransformDuration(InputUnit.MILLISECOND, "ms")
  @IsOptional()
  dequeueFrequency: number = 2000;

  @IsInt()
  @TransformDuration(InputUnit.MILLISECOND, "ms")
  @IsOptional()
  outboundContactResultWaitTime: number = 600000;
}

export class OutboundContactConfig {
  @IsInt()
  @TransformDuration(InputUnit.MILLISECOND, 'ms')
  @IsOptional()
  batchProcessOutboundContactCompletionFrequency: number = 500;

  /**
   * How frequently to check for contacts that have been in the ring state for too long
   */
  @IsInt()
  @TransformDuration(InputUnit.MILLISECOND, 'ms')
  ringTimeoutCheckFrequency: number = 1000;

  /**
   * The maximum number of contacts that we can hang up per iteration of the ring timeout check
   */
  @IsInt()
  maxRingTimeoutHangupsPerLoop: number = 10;


  /**
   * Whether to check AWS' view of the contact before completing it (uses DescribeContact API for each contact)
   */
  @IsBoolean()
  checkContactBeforeCompletion: boolean = true;
}

export class CacheFetchConfig {
  @IsInt()
  @TransformDuration(InputUnit.MILLISECOND, "ms")
  @IsOptional()
  retryTimer: number = 60000;

  @IsInt()
  @IsOptional()
  maxRetries: number = 3;
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
  @IsInstance(CrudApiConfig)
  @Type(() => CrudApiConfig)
  @Transform(({ value }) => CrudApiConfig.from(value), { toClassOnly: true })
  crudApi!: CrudApiConfig;

  @ValidateNested()
  @IsInstance(ApiCertificateConfig)
  @Type(() => ApiCertificateConfig)
  @Transform(({ value }) => ApiCertificateConfig.from(value), { toClassOnly: true })
  apiCertificate!: ApiCertificateConfig;

  @ValidateNested()
  @IsInstance(QueueConfig)
  @Type(() => QueueConfig)
  @IsOptional()
  queue: QueueConfig = new QueueConfig();

  @ValidateNested()
  @IsInstance(OutboundContactConfig)
  @Type(() => OutboundContactConfig)
  @IsOptional()
  outboundContacts: OutboundContactConfig = new OutboundContactConfig();

  @ValidateNested()
  @IsInstance(StreamGroupMonitorConfig)
  @Type(() => StreamGroupMonitorConfig)
  @Transform(({ value }) => StreamGroupMonitorConfig.from(value, 'queue_control_group'), { toClassOnly: true })
  @IsOptional()
  queueControlMonitor: StreamGroupMonitorConfig = StreamGroupMonitorConfig.from({}, 'queue_control_group');

  @ValidateNested()
  @IsInstance(DevConfig)
  @Type(() => DevConfig)
  @IsOptional()
  dev: DevConfig = new DevConfig();

  @ValidateNested()
  @IsInstance(CacheFetchConfig)
  @Type(() => CacheFetchConfig)
  @IsOptional()
  cacheFetch: CacheFetchConfig = new CacheFetchConfig();

  @IsInt()
  cacheFetchAppNameId!: number;

  @ValidateNested()
  @IsInstance(LogConfig)
  @Type(() => LogConfig)
  @IsOptional()
  logging!: LogConfig;

  static load() {
    const plainConf = loadConfigObject('queueService', true);
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
