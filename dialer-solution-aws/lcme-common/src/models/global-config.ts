import { transformAndValidateSync, TransformValidationOptions } from 'class-transformer-validator';
import { IsInt, IsString, IsInstance, IsOptional, Min, ValidateNested } from 'class-validator';
import { Exclude, Type } from 'class-transformer';
import { defaultCRUDTransformValidationOptions } from '../utils/validation';
import { Transformable } from './db-entity';

export class UserAuthDefinition {
  @IsString()
  AdminName!: string;

  @IsString()
  AdminPW!: string;

  @IsString()
  AdminAD!: string;

  @IsString()
  DeveloperAD!: string;

  @IsString()
  StrategistAD!: string;

  @IsString()
  ReadOnlyAD!: string;
}

export class ConnectConfigDefinition extends Transformable {
  @IsString()
  InstanceArn!: string;

  @IsString()
  AwsRegion!: string;

  @IsInt()
  @Min(1)
  ConnectProjectCPS!: number;

  @Exclude()
  private _InstanceId!: string;

  @Exclude()
  public get InstanceId(): string {
    if (!this._InstanceId) {
      const splat = this.InstanceArn.split('/');
      this._InstanceId = splat[splat.length - 1];
    }
    return this._InstanceId;
  }

  @Exclude()
  getInstanceId() {
    const splat = this.InstanceArn.split('/');
    return splat[splat.length - 1];
  }
}

export class DialerDefaultsDefinition extends Transformable {
  @IsString()
  ScheduleTimezone!: string;

  @IsString()
  ContactFlowId!: string;

  @IsInt()
  @Min(0)
  InitialCpaMin!: number;

  @IsInt()
  @Min(1)
  InitialCpaMax!: number;

  @IsInt()
  @Min(0)
  MaxCPA!: number;

  @IsInt()
  @Min(0)
  InitialPacingDurationMin!: number;

  @IsInt()
  @Min(1)
  InitialPacingDurationMax!: number;

  @IsInt()
  @Min(0)
  InitialPacingSamplesMin!: number;

  @IsInt()
  @Min(1)
  InitialPacingSamplesMax!: number;

  @IsInt()
  @Min(0)
  AbandonmentIncrementMin!: number;

  @IsInt()
  @Min(1)
  AbandonmentIncrementMax!: number;

  @IsInt()
  @Min(0)
  CpaModifierMin!: number;

  @IsInt()
  @Min(1)
  CpaModifierMax!: number;

  @IsInt()
  @Min(0)
  AbaTargetRateMin!: number;

  @IsInt()
  @Min(1)
  AbaTargetRateMax!: number;

  @IsInt()
  @Min(0)
  CallLimitRecordMin!: number;

  @IsInt()
  @Min(1)
  CallLimitRecordMax!: number;

  @IsInt()
  @Min(0)
  CallLimitPhoneMin!: number;

  @IsInt()
  @Min(1)
  CallLimitPhoneMax!: number;

  @IsInt()
  ScheduleLoopsMin!: number;

  @IsInt()
  @Min(1)
  ScheduleLoopsMax!: number;

  @IsInt()
  ConcurrentCallsMin!: number;

  @IsInt()
  @Min(1)
  ConcurrentCallsMax!: number;
}

export class GlobalConfigDefinition extends Transformable {
  static ENTITY_TYPE = 'global_config';

  @ValidateNested()
  @IsInstance(DialerDefaultsDefinition)
  @Type(() => DialerDefaultsDefinition)
  DialerDefaults!: DialerDefaultsDefinition;

  @ValidateNested()
  @IsInstance(ConnectConfigDefinition)
  @Type(() => ConnectConfigDefinition)
  Connect!: ConnectConfigDefinition;

  static from(globalObj: object): GlobalConfigDefinition {
    return transformAndValidateSync(GlobalConfigDefinition, globalObj, defaultCRUDTransformValidationOptions);
  }
}
