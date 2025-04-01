import { Transform, Type } from 'class-transformer';
import { transformAndValidateSync } from 'class-transformer-validator';
import { IsBoolean, IsIn, IsInstance, IsInt, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';

import { AwsCredentialsConfig } from 'lcme-services-common/lib/config/aws-credentials-config';
import { ClusterConfig } from 'lcme-services-common/lib/config/cluster';
import { loadConfigObject } from 'lcme-services-common/lib/config/config-loader';
import { DbConfig } from 'lcme-services-common/lib/config/db-config';
import { DbIntegrityCheckOptions } from 'lcme-services-common/lib/config/db-integrity-check';
import { HostConfig } from 'lcme-services-common/lib/config/host-config';
import { LogConfig } from 'lcme-services-common/lib/config/log-config';
import { ApiCertificateConfig } from 'lcme-services-common/lib/config/lcme-api-certificate-config';
import { CrudApiConfig } from 'lcme-services-common/lib/config/lcme-crud-api-config';
import { RestConfig } from 'lcme-services-common/lib/config/rest-config';
import { InputUnit } from 'lcme-common/lib/utils/duration-helper';
import { defaultConfigTransformValidationOptions } from 'lcme-common/lib/utils/validation';
import { exit } from 'process';
import { FilterValidationConfig } from './filter-validation';
import { TransformDuration } from './transform-duration';
import path from 'path';

export class DevConfig {
  @IsBoolean()
  @IsOptional()
  skipAuthCheck = false;

  @IsBoolean()
  @IsOptional()
  skipUpdateConflictChecks = false;

  @IsString({ each: true })
  @IsOptional()
  skipUpdateConflictChecksOn: string[] = [];

  @IsBoolean()
  @IsOptional()
  skiplcmeCrud = false;

  @TransformDuration(InputUnit.MILLISECOND, 'millisecond')
  @IsInt()
  @IsOptional()
  simulatedFilterValidationDelay = 0;

  @IsString()
  @IsOptional()
  devAdminToken?: string;

  isSkipUpdateConflictChecksOn(entityType: string) {
    if (this.skipUpdateConflictChecks) {
      return true;
    }
    return this.skipUpdateConflictChecksOn.includes(entityType);
  }
}

export class CognitoConfig {
  @IsString()
  userPoolId!: string;

  @IsString()
  userPoolClientId!: string;
}

export class ScheduleConfig {
  @IsInt()
  @IsOptional()
  scheduleOverlapCheckRange: number = 30;
}

export const configJsonMode = ['generated', 'file'] as const;
export type ConfigJsonMode = typeof configJsonMode[number];

export class WebUiConfig {
  @IsString()
  sourcePath: string = path.join(__dirname, '..', '..', 'web-ui');

  @IsString()
  @IsOptional()
  uriPath: string = '/web';

  @IsBoolean()
  @IsOptional()
  redirectRootToWebUi: boolean = true;

  @IsBoolean()
  @IsOptional()
  enabled: boolean = false;

  @IsString()
  @IsIn(configJsonMode)
  @IsOptional()
  configJsonMode: ConfigJsonMode = 'generated';
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
  @IsInstance(CognitoConfig)
  @Type(() => CognitoConfig)
  @ValidateIf((o) => !o.dev.skipAuthCheck || o.webUi?.enabled)
  cognito!: CognitoConfig;

  @ValidateNested()
  @IsInstance(WebUiConfig)
  @Type(() => WebUiConfig)
  webUi: WebUiConfig = new WebUiConfig();

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
  @IsOptional()
  @IsInstance(HostConfig)
  @Type(() => HostConfig)
  @Transform(({ value }) => HostConfig.from(value), { toClassOnly: true })
  server: HostConfig = new HostConfig();

  @ValidateNested()
  @IsInstance(RestConfig)
  @Type(() => RestConfig)
  @Transform(({ value }) => RestConfig.from(value), { toClassOnly: true })
  rest!: RestConfig;

  @ValidateNested()
  @IsInstance(ScheduleConfig)
  @Type(() => ScheduleConfig)
  @IsOptional()
  schedule: ScheduleConfig = new ScheduleConfig();

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

  @IsInt()
  configApiAppNameId!: number;

  @ValidateNested()
  @IsInstance(FilterValidationConfig)
  @Type(() => FilterValidationConfig)
  @IsOptional()
  filterValidation: FilterValidationConfig = new FilterValidationConfig();

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

  static load() {
    const plainConf = loadConfigObject('configApiService', true);
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
