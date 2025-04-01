import IORedis, { ChainableCommander } from "ioredis";
import { Logger } from "../logger/logger";
import { RedisClientPool } from "./redis-client-pool";

export const serviceTypes = (<T extends string[]>(...o: T) => o)('config_api', 'campaign_manager', 'queue', 'stats')
export type ServiceType = typeof serviceTypes[number]

export type ServiceInfo = {
    type: ServiceType,
    label: string,
    id: string,
    instance: number
}

export type InactiveServiceInfo = {
    id: string,
    type: ServiceType
}

const serviceInfoHashKeys = [ 'type', 'label', 'id', 'instance' ]

export class ServiceInfoDb {
    protected readonly logger: Logger = Logger.getLogger()
    public readonly baseKey: string

    constructor(private readonly redisClientPool: RedisClientPool) {
        this.baseKey = `${redisClientPool.makeBaseRedisKey('service_status')}`
    }

    private makeServiceBaseKey(serviceType: ServiceType) {
        return `${this.baseKey}:${serviceType}`
    }

    async create(serviceType: ServiceType, serviceLabel: string, ttl: number) {
        const serviceBaseKey = this.makeServiceBaseKey(serviceType)
        const instanceIncrHashKey = `${serviceBaseKey}.instance_incr`

        const instanceIdNum = await this.redisClientPool.run((redisClient) => {
            return redisClient.hincrby(instanceIncrHashKey, serviceLabel, 1)
        })
        const serviceKey = `${this.baseKey}:${serviceType}:${serviceLabel}:${instanceIdNum}`
        const serviceInfo: ServiceInfo = {
            id: serviceKey,
            label: serviceLabel,
            type: serviceType,
            instance: instanceIdNum
        }
        await this.setAndExpire(serviceInfo, ttl)
        return serviceInfo
    }

    async setAndExpire(serviceInfo: ServiceInfo, ttl: number) {
        const serviceBaseKey = this.makeServiceBaseKey(serviceInfo.type);
        const servicesSetKey = `${serviceBaseKey}.services`;
        return this.redisClientPool.run((redisClient) => {
            const multi = this.redisClientPool.getMultiOrPipeline(redisClient, true);
            multi.hset(
                serviceInfo.id,
                "type",
                serviceInfo.type,
                "label",
                serviceInfo.label,
                "id",
                serviceInfo.id,
                "instance",
                serviceInfo.instance
              );
            multi.sadd(servicesSetKey, serviceInfo.id);
            multi.expire(serviceInfo.id, ttl);
            return multi.exec();
        })
    }
    async heartbeat(serviceInfo: ServiceInfo, ttl: number) {
        this.logger.log('verbose', `Sending heartbeat for service ${serviceInfo.id} with TTL ${ttl}`);
        const result = await this.redisClientPool.run((redisClient) => {
            return redisClient.expire(serviceInfo.id, ttl)
        })
        if (result === 0) {
            this.logger.log('info', `Service key ${serviceInfo.id} expired, recreating`);
            await this.setAndExpire(serviceInfo, ttl);
            return false
        }
        return true
    }

    async ttl(serviceId: string) {
        return this.redisClientPool.run((redisClient) => {
            return redisClient.ttl(serviceId)
        })
    }

    hmgetResultToServiceInfo(hmgetResult: (string | null)[]) {
        if (!hmgetResult || hmgetResult.includes(null)) {
            return
        }
        const [ type, label, id, instance ] = hmgetResult as string[]
        return {
            type,
            label,
            id,
            instance: parseInt(instance)
        } as ServiceInfo
    }

    async getServiceInfo(serviceId: string) {
        const serviceInfoArr: (string | null)[] = await this.redisClientPool.run((redisClient) => {
            return redisClient.hmget(serviceId, ...serviceInfoHashKeys)
        })
        return this.hmgetResultToServiceInfo(serviceInfoArr)
    }

    async getServiceInstanceKeys(...serviceTypes: ServiceType[]): Promise<string[]> {
        if (serviceTypes.length === 0) {
            return []
        }
        const serviceInstanceSetKeys = serviceTypes.map((serviceType) => `${this.makeServiceBaseKey(serviceType)}.services`)
        if (serviceInstanceSetKeys.length === 1) {
            return this.redisClientPool.run((redisClient) => {
                return redisClient.smembers(serviceInstanceSetKeys[0])
            })
        } else {
            return this.redisClientPool.run((redisClient) => {
                return redisClient.sunion(...serviceInstanceSetKeys)
            })
        }
    }

    public extractActiveServices(serviceInfos: ServiceInfo[]) {
        return serviceInfos.filter((serviceInfo) => serviceInfo.label && serviceInfo.type)
    }

    public extractInactiveServices(serviceInfos: ServiceInfo[]): InactiveServiceInfo[] {
        return serviceInfos.filter((serviceInfo) => !serviceInfo.label).map((serviceInfo) => {
            return {
                id: serviceInfo.id,
                type: serviceInfo.type
            }
        })
    }

    public async getActiveServiceInfos(serviceTypes: ServiceType[], pipeline?: ChainableCommander): Promise<ServiceInfo[]> {
        const all = await this.getServiceInfosWithEmpties(serviceTypes, pipeline)
        return this.extractActiveServices(all)
    }

    public async getInactiveServices(serviceTypes: ServiceType[], pipeline?: ChainableCommander) {
        const all = await this.getServiceInfosWithEmpties(serviceTypes, pipeline)
        return this.extractInactiveServices(all)
    }
    
    public async getServiceInfos(serviceTypes: ServiceType[], pipeline?: ChainableCommander) {
        const all = await this.getServiceInfosWithEmpties(serviceTypes, pipeline)
        const active = this.extractActiveServices(all)
        const inactive = this.extractInactiveServices(all)
        return {
            active,
            inactive
        }
    }

    public getAllServiceInfos() {
        return this.getServiceInfos(serviceTypes)
    }

    public async clearInactiveServices(...serviceTypes: ServiceType[]) {
        const toRemove = await this.getInactiveServices(serviceTypes)
        if (toRemove.length === 0) {
            return 0
        }
        const result = await this.redisClientPool.runForcePipeline((pipeline) => {
            const promises: Promise<number>[] = []
            for (let serviceType of serviceTypes) {
                const servicesSetKey = `${this.makeServiceBaseKey(serviceType)}.services`
                const serviceEntriesToRemove = toRemove.filter((serviceInfo) => serviceInfo.type === serviceType)
                if (serviceEntriesToRemove.length > 0) {
                    promises.push(this.redisClientPool.srem(servicesSetKey, (serviceEntriesToRemove.map((serviceEntry) => serviceEntry.id)), pipeline))
                }
            }
            return Promise.all(promises)
        })
        const numDeleted = result!.reduce((prev, cur) => {
            return prev + cur
        }, 0)
        return numDeleted
    }

    public async removeService(serviceType: ServiceType, serviceId: string) {
        const servicesSetKey = `${this.makeServiceBaseKey(serviceType)}.services`
        return this.redisClientPool.run((redisClient) => {
            return redisClient.srem(servicesSetKey, serviceId)
        })
    }

    private async getServiceInfosWithEmpties(serviceTypes: ServiceType[], pipeline?: ChainableCommander): Promise<ServiceInfo[]> {
        if (serviceTypes.length === 0) {
            return []
        }
        const serviceInstanceSetKeys = serviceTypes.map((serviceType) => `${this.makeServiceBaseKey(serviceType)}.services`)
        const results = await this.redisClientPool.runForcePipeline((pipeline) => {
            return Promise.all(
                serviceInstanceSetKeys.map((keySet) => 
                    this.redisClientPool.sort([keySet, 'by', 'NOSORT', 'GET', '#', 'GET', '*->label', 'GET', '*->instance'], pipeline)
                )
            )
        }, pipeline)
        const toReturnM = Object.fromEntries(serviceTypes.map(key => [key, [] as ServiceInfo[]]))
        const toReturn: ServiceInfo[] = []
        results.forEach((result, index) => {
            const type = serviceTypes[index]
            const arrResult = result as string[]
            for (let i = 0; i<arrResult.length; i+= 3) {
                toReturnM[type].push({
                    id: arrResult[i],
                    type,
                    label: arrResult[i+1],
                    instance: parseInt(arrResult[i+2])
                })
                toReturn.push({
                    id: arrResult[i],
                    type,
                    label: arrResult[i+1],
                    instance: parseInt(arrResult[i+2])
                })
            }
        })
        return toReturn
    } 

}