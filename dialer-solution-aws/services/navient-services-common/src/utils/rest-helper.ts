import { Express } from 'express'
import https from 'https'
import http from 'http'
import fs from 'fs'
import { RestConfig } from "../config/rest-config";
import { HostConfig } from '../config/host-config';
import { Logger } from '../logger/logger';

export function startExpressServer(restConfig: RestConfig, serverConfig: HostConfig, app: Express) {
    const logger = Logger.getLogger()
    const hostName = serverConfig.hostname;
    if (restConfig.isHttpEnabled) {
        const httpServer = http.createServer(app)
        httpServer.listen(restConfig.port, hostName, () => {
            logger.log('info', `HTTP server listening at ${restConfig.getAddress(serverConfig.hostname)} with public address ${restConfig.getPublicAddress(serverConfig.hostname)}`)
        })
    } else if (restConfig.httpsCredentials) {
        const key = fs.readFileSync(restConfig.httpsCredentials.keyFilePath)
        const cert = fs.readFileSync(restConfig.httpsCredentials.certFilePath)
        const httpsServer = https.createServer({
            key,
            cert
        }, app)
        httpsServer.listen(restConfig.port, hostName, () => {
            logger.log('info', `HTTPS server listening at ${restConfig.getAddress(serverConfig.hostname)} with public address ${restConfig.getPublicAddress(serverConfig.hostname)}`)
        })
    } else {
        throw new Error(`No protocol enabled: set "httpsCredentials" to use https, or set "isHttpsEnabled" to use http`)
    }
}