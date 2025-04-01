import { plainToClass, Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInstance,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export function getPlainDbConfFromEnv() {
  return {
    host: process.env["REDIS_HOST"],
    port: process.env["REDIS_PORT"],
    username: process.env["REDIS_USER"],
    password: process.env["REDIS_PASSWORD"],
    namespace: process.env["REDIS_NAMESPACE"],
    streamPrefix: process.env["REDIS_STREAM_PREFIX"],
    keyHashTagMode: process.env["REDIS_KEY_HASH_TAG_MODE"],
    tls: {}
  };
}

export enum KeyHashTagMode {
  NONE = "NONE",
  ENTITY_TYPE = "ENTITY_TYPE",
  NAMESPACE_AND_ENTITY_TYPE = "NAMESPACE_AND_ENTITY_TYPE",
}

export enum UnreferencedKeyBehaviour {
  DELETE = "DELETE",
  REINSTATE = "REINSTATE",
  NONE = "NONE",
}

export class DbConfig {
  @IsString()
  host!: string;

  @IsInt()
  @Max(65535)
  @Min(1)
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  port!: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  password!: string;

  @IsString()
  namespace!: string;

  @IsString()
  @IsOptional()
  streamPrefix?: string;

  @IsEnum(KeyHashTagMode)
  @IsOptional()
  keyHashTagMode: KeyHashTagMode = KeyHashTagMode.NONE;

  @IsInt()
  @Min(0)
  keyScanCount = 500;

  @IsBoolean()
  @IsOptional()
  patchDbOnStart = true;

  @IsBoolean()
  @IsOptional()
  sharded = true;

  @IsNumber()
  @IsOptional()
  minClients: number = 10;

  @IsNumber()
  @IsOptional()
  @Min(10)
  maxClients: number = 100;

  @IsNumber()
  @IsOptional()
  poolAcquireWarningThresholdMs: number = 500;

  static from(plain: object) {
    return plainToClass(DbConfig, plain);
  }
}
