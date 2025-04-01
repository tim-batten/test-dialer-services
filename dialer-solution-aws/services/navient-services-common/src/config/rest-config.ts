import { plainToClass, Type } from "class-transformer";
import { transformAndValidateSync } from "class-transformer-validator";
import { IsInstance, IsInt, IsObject, IsOptional, IsString, Max, Min, ValidateNested, IsBoolean } from "class-validator";
import { CorsConfig } from './cors-config';

export class HttpsCredentialsConfig {
    @IsString()
    keyFilePath!: string

    @IsString()
    certFilePath!: string

    static from(plain: object): HttpsCredentialsConfig {
        return transformAndValidateSync(HttpsCredentialsConfig, plain)
    }
}

export class RestConfig {
  @IsInt()
  @Max(65535)
  @Min(1025)
  port!: number;

  @ValidateNested()
  @IsInstance(CorsConfig)
  @Type(() => CorsConfig)
  cors: CorsConfig = new CorsConfig();

  @IsString()
  @IsOptional()
  protected publicAddress?: string;

  @ValidateNested()
  @IsInstance(HttpsCredentialsConfig)
  @Type(() => HttpsCredentialsConfig)
  @IsOptional()
  httpsCredentials?: HttpsCredentialsConfig;

  @IsBoolean()
  isHttpEnabled: boolean = false;

  getPublicAddress(hostname: string) {
    if (!this.publicAddress) {
      this.publicAddress = this.getAddress(hostname);
    }
    return this.publicAddress;
  }

  getAddress(hostname: string) {
    const protocol = this.isHttpEnabled ? 'http' : 'https';
    return `${protocol}://${hostname}:${this.port}`;
  }

  static from(plain: object) {
    const toReturn = transformAndValidateSync(RestConfig, plain);
    if (toReturn.isHttpEnabled === false && !toReturn.httpsCredentials) {
      throw new Error('rest config: set "httpsCredentials" to use https, or set "isHttpsEnabled" to use http');
    }
    return toReturn;
  }
}