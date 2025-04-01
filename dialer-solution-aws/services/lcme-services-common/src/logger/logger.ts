import winston from 'winston'
import { LogConfig } from '../config/log-config'
import { forceArray } from '../utils/object-helper'
import { LogEntity } from 'lcme-common/lib/types/logger'

interface TransportOpts {
    console: typeof winston.transports.Console
}

export type LoggerOptions = {
    entityId: string | undefined | (string | undefined) [],
    entity: LogEntity | undefined | ( LogEntity | undefined) []
}

export const logLevels = (<T extends string[]>(...o: T) => o)('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')

export type LoggerLevel = typeof logLevels[number]

export class Logger {
    static baseConfig: LogConfig

    logger: winston.Logger

    static init(config: LogConfig) {
        Logger.baseConfig = config
    }

    static getLogger(loggerOptions?: Partial<LoggerOptions>) {
        // In the future may extend this to pass in args and merge with base config
        return Logger.fromConfig(Logger.baseConfig, loggerOptions, false)
    }

    static fromConfig(config: LogConfig, loggerOptions?: Partial<LoggerOptions>, exitOnError: boolean = false) {
        const logMetadata = config ? config.logMetadata : {}
        const logFile = config ? config.logFile : undefined
        const logLevel = config && config.logLevel ? config.logLevel : 'debug'
        loggerOptions = loggerOptions || {}
        return new Logger(logLevel, { ...logMetadata }, [logFile || 'console'], config, loggerOptions, exitOnError)
    }

    private constructor(level: string, userMetadata: any, transports: string[], private logConfig: LogConfig, private loggerOptions: Partial<LoggerOptions>, exitOnError: boolean) {
        const format = winston.format.json()

        const derivedTransports: any[] = transports.map((transport: string) => transport.includes('.') ?
            new winston.transports.File({ filename: transport }) :
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.printf(info => `[${info.timestamp}] ${info.message}`)
                )
            }))

        const defaultMeta = { ...userMetadata, logTime: new Date() }

        this.logger = winston.createLogger({
            level,
            format,
            defaultMeta,
            transports: derivedTransports,
            exitOnError,
        });
    }

    private stringify(object: unknown) {
        try {
            if (typeof object === 'string') {
                return object
            } else if (object instanceof Error) {
                return object.stack ? object.stack : object.toString()
            } else if (typeof object === 'object') {
                return JSON.stringify(object)
            } else {
                return String(object)
            }
        } catch (e) {
            return 'UNPARSEABLE'
        }
    }

    isLoggable(level: LoggerLevel) {
        const winstonLevel = this.logger.levels[this.logger.level]
        const incomingLevel = this.logger.levels[level]
        return winstonLevel >= incomingLevel
    }

    async mlog(level: LoggerLevel, messages: any[], options: Partial<LoggerOptions> = {}) {
        if (!this.isLoggable(level)) {
            return
        }
        messages = messages.map((message) => this.stringify(message))
        this.log(level, messages.join(' '), options)
    }

    async log(level: LoggerLevel, message: unknown, options: Partial<LoggerOptions> = {}) {
        if (!this.isLoggable(level)) {
            return
        }
        const messagePrepend = level === 'error' ? 'ERROR ' : level === 'warn' ? 'WARNING ' : ''
        let stringMessage = `${messagePrepend}${this.stringify(message)}`
        if (options.entity || options.entityId) {
            const ids = new Set<string>()
            forceArray(options.entity).forEach((entity) => {
                if (entity) {
                    entity.getEntityIdArr().forEach((entityId) => ids.add(entityId))
                }
            }
            )
            forceArray(options.entityId).forEach((entityId) => {
                if (entityId)
                    ids.add(entityId)
            })
            let insertComma = false
            let entityIds = ''
            ids.forEach((entityId) => {
                entityIds = `${entityIds}${insertComma === true ? ', ' : ''}${entityId}`
                insertComma = true
            })
            stringMessage = `[${entityIds}] ${stringMessage}`
        }

        this.logger.log({
            level,
            message: stringMessage
        })
    }
}