import { GlobalConfigDefinition } from 'navient-common/lib/models/global-config'
import { Logger } from 'navient-services-common/lib/logger/logger'
import { globalConfigDb } from '../globals'
import { ChainableCommander } from 'ioredis'

export class GlobalConfigManager {
    protected readonly logger: Logger = Logger.getLogger()

    constructor() {
    }

    public async set(globalConfigDefinition: GlobalConfigDefinition) {
        await globalConfigDb.set(globalConfigDefinition)
    }

    public get(pipeline?: ChainableCommander) {
        return globalConfigDb.get(pipeline)
    }
}