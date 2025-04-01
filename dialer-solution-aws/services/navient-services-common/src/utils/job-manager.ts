import { JobManagerDb } from "../db/job-manager-db";
import { RedisClientPool } from "../db/redis-client-pool";
import { ServiceInfo } from "../db/service-info-db";
import { Logger } from "../logger/logger";
import { distributeArray } from "./object-helper";
import { InactiveServiceInfoWithJobs, ServiceInfoWithJobs, ServiceManager } from "./service-manager";

export class JobManager {

    private logger = Logger.getLogger()
    jobDb: JobManagerDb

    constructor(private redisClientPool: RedisClientPool, private serviceManager: ServiceManager) {
        this.jobDb = new JobManagerDb(redisClientPool)
    }

    async redistributeOrphanedJobs(allServices: { active: ServiceInfoWithJobs[]; inactive: InactiveServiceInfoWithJobs[]; }) {
        const { active, inactive } = allServices
        if (inactive.length === 0 || active.length === 0) {
            return
        }
        const allInactiveJobs: [string, string][] = [] 
        inactive.forEach((service) => {
            const servicesAndJobs: [string, string][] = service.jobs.map((job) => [service.id, job])
            allInactiveJobs.push(...servicesAndJobs)
        })
        for (const inactiveJob of allInactiveJobs) {
            const [ currentWorker, jobId ] = inactiveJob
            const activeSorted = active.sort((a, b) => a.jobs.length - b.jobs.length)
            const distributeTo = activeSorted[0]
            distributeTo.jobs.push(inactiveJob[1])
            this.logger.log('info', `Redistributing job ${jobId} from ${currentWorker} to ${distributeTo.id}`)
            try {
                await this.jobDb.acquireJob(jobId, distributeTo.id, currentWorker)
            } catch (e: any) {
                this.logger.log('info', e.message)
            }
        }
    }
}