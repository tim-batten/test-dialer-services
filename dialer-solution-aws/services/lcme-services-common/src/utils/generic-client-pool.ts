import EventEmitter from 'events';
import genericPool from 'generic-pool'
import { Logger } from "../logger/logger";

export declare interface GenericPoolFactoryEmitter<T> extends genericPool.Factory<T> {
    on(event: 'pool-resource-created', listener: () => void): this;
    on(event: 'pool-resource-destroyed', listener: () => void): this;
}

export abstract class GenericPoolFactory<T> extends EventEmitter implements GenericPoolFactoryEmitter<T> {
    async create(): Promise<T> {
        const toReturn = await this.createInternal()
        this.emit('pool-resource-created')
        return toReturn
    }
    async destroy(client: T): Promise<void> {
        await this.destroyInternal(client)
        this.emit('pool-resource-destroyed')
    }
    
    protected abstract createInternal(): Promise<T>
    protected abstract destroyInternal(client: T): Promise<void>
}

export declare interface GenericClientPool<T> {
    on(event: 'pool-at-capacity', listener: () => void): this;
}

export class GenericClientPool<T> extends EventEmitter {
    protected logger: Logger = Logger.getLogger()
    private clientPool: genericPool.Pool<T>
    constructor(protected factory: GenericPoolFactoryEmitter<T>, min: number, max: number, private acquireWarningThresholdMs: number, private name: string) {
        super()
        this.clientPool = genericPool.createPool(factory, {
            max,
            min
        })
        this.factory.on('pool-resource-created', () => {
            this.logger.log('info', `Created new entity in pool "${this.name}". Current pool status: ${this.getPoolStatus()}`)
            if (this.clientPool.spareResourceCapacity === 0) {
                this.emit('pool-at-capacity')
            }
        })
        this.factory.on('pool-resource-destroyed', () => {
            this.logger.log('info', `Destroyed entity in pool "${this.name}". Current pool status: ${this.getPoolStatus()}`)
        })
    }

    getPoolStatus() {
        return `Size: ${this.clientPool.size} Max: ${this.clientPool.max} Available: ${this.clientPool.available} Borrowed: ${this.clientPool.borrowed} Pending: ${this.clientPool.pending}`
    }

    public async run<R>(toRun: (client: T) => R) {
        let client: T | undefined = undefined
        let timeout
        if (this.acquireWarningThresholdMs > 0) {
            timeout = setTimeout(() => {
                if (client === undefined) {
                    this.logger.log('warn', `Time to acquire resource from pool "${this.name}" has exceeded the warning threshold of ${this.acquireWarningThresholdMs}ms. Current pool status: ${this.getPoolStatus()}`)
                }
            }, this.acquireWarningThresholdMs)
        }
        client = await this.clientPool.acquire()
        if (timeout) {
            clearTimeout(timeout)
        }
        try {
            const toReturn = await toRun(client)
            this.clientPool.release(client)
            return toReturn
        } catch (e) {
            //TODO: Do something more useful with this (e.g. retries)
            //this.logger.log('error', e)
            throw e
        }
    }
}