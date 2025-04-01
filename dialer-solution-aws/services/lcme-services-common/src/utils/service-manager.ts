import { ChainableCommander } from "ioredis";
import { ClusterConfig } from "../config/cluster";
import { JobManagerDb } from "../db/job-manager-db";
import { RedisClientPool } from "../db/redis-client-pool";
import { InactiveServiceInfo, ServiceInfo, ServiceInfoDb, ServiceType } from "../db/service-info-db";
import { Logger } from "../logger/logger";
import { setTimeoutLoop } from "./general";
import { JobManager } from "./job-manager";

export interface ServiceInfoWithJobs extends ServiceInfo {
    jobs: string[]
}

export interface InactiveServiceInfoWithJobs extends InactiveServiceInfo {
    jobs: string[]
}


export interface ActiveServiceStatusEventListener {
    servicesBecameActive(services: ServiceInfo[]): Promise<void>
}

export interface InactiveServiceStatusEventListener {
    servicesBecameInactive(inactiveServices: InactiveServiceInfoWithJobs[]): Promise<void>
}

export class ServiceManager {

    private static instance: ServiceManager

    private readonly logger = Logger.getLogger()
    public readonly serviceInfo: ServiceInfo
    public readonly jobManager: JobManager

    private activeServiceStatusEventListeners: ActiveServiceStatusEventListener[] = []
    private inactiveServiceStatusEventListeners: InactiveServiceStatusEventListener[] = []
    private activeServiceList: ServiceInfo[]

    public static async init(redisClientPool: RedisClientPool, clusterConfig: ClusterConfig, serviceType: ServiceType) {
        const serviceInfoDb = new ServiceInfoDb(redisClientPool)
        const serviceInfo = await serviceInfoDb.create(serviceType, clusterConfig.serviceLabel, clusterConfig.serviceTTL)
        ServiceManager.instance = new ServiceManager(redisClientPool, serviceInfoDb, clusterConfig, serviceInfo)
        await ServiceManager.instance.start()
    }

    public static getInstance() {
        return ServiceManager.instance
    }

    public constructor(private readonly redisClientPool: RedisClientPool, public readonly serviceInfoDb: ServiceInfoDb, private readonly clusterConfig: ClusterConfig,
        serviceInfo: ServiceInfo) {
        this.jobManager = new JobManager(redisClientPool, this)
        this.serviceInfo = serviceInfo
        this.serviceInfoDb = serviceInfoDb
        this.activeServiceList = [this.serviceInfo]
    }

    public async start() {
        await setTimeoutLoop(async () => {
            await this.serviceInfoDb.heartbeat(this.serviceInfo, this.clusterConfig.serviceTTL)
            return true
        }, 'Service heartbeat', this.clusterConfig.serviceHeartbeatFrequency, {
            immediate: false
        })

        await setTimeoutLoop(async () => {
            const previousActiveServices = this.activeServiceList
            const [ allServices, workerToJobs ] = await this.redisClientPool.runForcePipeline((pipeline) => Promise.all([
                this.getAllServicesWithJobs(pipeline),
                this.jobManager.jobDb.getWorkerToJobs(pipeline)
            ]))
            // Sometimes, it's possible for a worker to acquire a job and for its service info to have been deleted meaning nothing will detect it going down
            const allActiveServiceKeys = new Set<string>(allServices.active.map((service) => service.id))
            const allInactiveServiceKeys = new Set<string>(allServices.inactive.map((service) => service.id))
            for (const [worker, jobs] of Array.from(workerToJobs)) {
                if (!worker.startsWith(`${this.serviceInfoDb.baseKey}:${this.serviceInfo.type}:`) || allActiveServiceKeys.has(worker) || allInactiveServiceKeys.has(worker)) {
                    continue;
                }
                const inactiveService = {
                    id: worker,
                    type: this.serviceInfo.type,
                    jobs
                }
                this.logger.log('info', `Detected non-existent service ${worker} with jobs; adding to inactive list to redistribute`)
                allServices.inactive.push(inactiveService)
            }

            const selfInactiveIdx = allServices.inactive.findIndex((serviceInfo) => serviceInfo.id === this.serviceInfo.id)
            if (selfInactiveIdx >= 0) {
                this.logger.log(
                  "warn",
                  `Service manager has detected self (${this.serviceInfo.id}) as inactive; this will be ignored locally but other services of the same type may attempt to redistribute this service's jobs`
                );
                const selfInactive = allServices.inactive[selfInactiveIdx]
                allServices.inactive.splice(selfInactiveIdx, 1)
                allServices.active.push({
                    ...this.serviceInfo,
                    jobs: selfInactive.jobs
                })
            }

            this.jobManager.redistributeOrphanedJobs(allServices)
            this.clearInactiveServices(allServices.inactive)

            const currentActiveServices = allServices.active
            const currentInactiveServices = allServices.inactive              

            this.activeServiceList = currentActiveServices

            const prevActiveServiceKeys = previousActiveServices.map((serviceInfo) => serviceInfo.id)

            const becomeInactive = currentInactiveServices.filter((service) => prevActiveServiceKeys.includes(service.id))
            const becomeActive = currentActiveServices.filter((service) => !prevActiveServiceKeys.includes(service.id))

            if (becomeInactive.length > 0) {
                if (this.logger.isLoggable('verbose')) {
                    this.logger.log('verbose', `The following service instances have become inactive: ${becomeInactive.map((service) => `${service.id} with ${service.jobs.length} jobs`)}`)
                }
                this.inactiveServiceStatusEventListeners.forEach((serviceHandler) => {
                    serviceHandler.servicesBecameInactive(becomeInactive)
                })
            }
            if (becomeActive.length > 0) {
                if (this.logger.isLoggable('verbose')) {
                    this.logger.log('verbose', `The following service instances have become active: ${becomeActive.map((service) => service.id)}`)
                }
                this.activeServiceStatusEventListeners.forEach((serviceHandler) => {
                    serviceHandler.servicesBecameActive(becomeActive)
                })
            }
            return true
        }, 'Service status monitor', this.clusterConfig.serviceStatusMonitorFrequency, {
            immediate: true
        })
    }

    private async clearInactiveServices(inactiveServices: InactiveServiceInfoWithJobs[]) {
        for (const { id, jobs } of inactiveServices) {
            if (jobs.length === 0) {
                this.logger.log('info', `Service ${id} has no jobs remaining and is inactive; removing`)
                await this.serviceInfoDb.removeService(this.serviceInfo.type, id)
            } else {
                this.logger.log('info', `Inactive service ${id} still has ${jobs.length} remaining jobs; not removing`)
            }
        }
    }

    public async addInactiveStatusListener(serviceStatusEventListener: InactiveServiceStatusEventListener) {
        const allServices = await this.getAllServicesWithJobs()
        serviceStatusEventListener.servicesBecameInactive(allServices.inactive)
        this.inactiveServiceStatusEventListeners.push(serviceStatusEventListener)
    }

    public async addActiveStatusListener(serviceStatusEventListener: ActiveServiceStatusEventListener) {
        const allServices = await this.getAllServicesWithJobs()
        serviceStatusEventListener.servicesBecameActive(allServices.active)
        this.activeServiceStatusEventListeners.push(serviceStatusEventListener)
    }

    public acquireJob(jobKey: string, acquireFrom?: string) {
        return this.jobManager.jobDb.acquireJob(jobKey, this.serviceInfo.id, acquireFrom)
    }

    public releaseJob(jobKey: string) {
        return this.jobManager.jobDb.releaseJob(jobKey, this.serviceInfo.id)
    }

    public getJobs() {
        return this.jobManager.jobDb.getAllJobsForWorker(this.serviceInfo.id)
    }

    public hasJob(jobKey: string) {
        return this.jobManager.jobDb.hasJob(jobKey, this.serviceInfo.id)
    }

    public getWorkerForJob(jobKey: string) {
        return this.jobManager.jobDb.getWorkerForJob(jobKey)
    }

    public async getAllServicesWithJobs(pipeline?: ChainableCommander) {
        return await ServiceManager.getAllServicesWithJobs(this.serviceInfoDb, this.jobManager.jobDb, [this.serviceInfo.type], pipeline)
    }

    public getServicePosition() {
        const sorted = this.activeServiceList.sort((s1, s2) => s1.id.localeCompare(s2.id))
        return sorted.findIndex((serviceI, idx, arr) => {
            if (serviceI.id === this.serviceInfo.id) {
                return true
            }
        })
    }

    public getActiveServiceCount() {
        return this.activeServiceList.length
    }

    public static async getAllServicesWithJobs(serviceInfoDb: ServiceInfoDb, jobDb: JobManagerDb, serviceTypes: ServiceType[], pipeline?: ChainableCommander) {
        const allServices = await serviceInfoDb.getServiceInfos(serviceTypes, pipeline)
        const allIds = [...allServices.active.map((service) => service.id), ...allServices.inactive.map((service) => service.id)]
        const allJobs = await jobDb.getAllJobsForWorkers(allIds)

        const activeServicesWithJobs: ServiceInfoWithJobs[] = allServices.active.map((service) => {
            return {
                ...service,
                jobs: allJobs.filter((job) => job[0] === service.id).map((job) => job[1])
            }
        })
        const inactiveServicesWithJobs: InactiveServiceInfoWithJobs[] = allServices.inactive.map((service) => {
            return {
                ...service,
                jobs: allJobs.filter((job) => job[0] === service.id).map((job) => job[1])
            }
        })
        return {
            active: activeServicesWithJobs,
            inactive: inactiveServicesWithJobs
        }
    }
}