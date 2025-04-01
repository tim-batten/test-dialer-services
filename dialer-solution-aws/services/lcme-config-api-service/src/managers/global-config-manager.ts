import { GlobalConfigDefinition } from 'lcme-common/lib/models/global-config'
import { Logger } from 'lcme-services-common/lib/logger/logger'
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