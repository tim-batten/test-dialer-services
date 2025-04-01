import { Exclude, plainToClass } from "class-transformer"
import { IsOptional, IsString } from "class-validator"
import { HTTPSOptions } from "got"
import { envGetString } from "../utils/env-helper"
import fs from 'fs';

export class ApiCertificateConfig {
    @IsString()
    @IsOptional()
    private certificateFilename: string = 'config/cert.pfx'

    @IsString()
    @IsOptional()
    private certificatePassphrase?: string

    @IsString()
    @IsOptional()
    private keyFilePath?: string

    @IsString()
    @IsOptional()
    private certFilePath?: string

    @IsString()
    @IsOptional()
    private certificateAuthorityFilePath?: string

    @Exclude()
    private httpsOptions!: HTTPSOptions

    getHttpsOptions() {
        return this.httpsOptions
    }

    private makeHTTPSOptions() {
        if (this.keyFilePath && this.certFilePath) {        
            this.httpsOptions = {
                key: fs.readFileSync(this.keyFilePath),
                certificate: fs.readFileSync(this.certFilePath)
            }
        } else if (this.certificateFilename && this.certificatePassphrase) {
            this.httpsOptions = {
                pfx: fs.readFileSync(this.certificateFilename),
                passphrase: this.certificatePassphrase
            }
        } else {
            throw 'Invalid API certificate config - either keyFilePath and certFilePath or certificateFilename and certificatePassphrase must be set'
        }
        if (this.certificateAuthorityFilePath) {
            this.httpsOptions.certificateAuthority = fs.readFileSync(this.certificateAuthorityFilePath)
        }
    }

    static from(plain: any) {
        plain = plain || {}
        const certPassphrase = envGetString('NAVIENT_API_CERT_PASSPHRASE')
        if (certPassphrase) {
            plain.certificatePassphrase = certPassphrase
        }
        const toReturn = plainToClass(ApiCertificateConfig, plain)
        toReturn.makeHTTPSOptions()
        return toReturn
    }
}
