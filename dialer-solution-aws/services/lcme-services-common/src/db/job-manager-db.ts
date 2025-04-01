import { ChainableCommander } from "ioredis";
import { Logger } from "../logger/logger";
import { ServiceManager } from "../utils/service-manager";
import { RedisClientPool } from "./redis-client-pool";

export class JobAcquisitionFailure extends Error {

}

export class JobManagerDb {
    logger: Logger = Logger.getLogger()
    jobToWorkerKey: string
    baseWorkerToJobKey: string

    constructor(private readonly redisClientPool: RedisClientPool) {
        this.jobToWorkerKey = `${redisClientPool.makeBaseRedisKey('jobs')}:job_to_worker`
        this.baseWorkerToJobKey = `${redisClientPool.makeBaseRedisKey('jobs')}:worker_to_job`
    }

    makeWorkerToJobKey(workerKey: string) {
        return `${this.baseWorkerToJobKey}:${workerKey}`
    }

    async acquireJob(jobKey: string, workerKey: string, acquireFrom?: string) {
        this.logger.log('verbose', `Worker ${workerKey} is attempting to acquire job ${jobKey}${acquireFrom ? ` from ${acquireFrom}` : ''}`)
        const lockKey = `${this.redisClientPool.makeBaseRedisKey('lock')}:${jobKey}`
        let lock
        try {
            lock = await this.redisClientPool.redlock.acquire([lockKey], 3000)
        } catch (e) {
            this.logger.log('info', `Failed to acquire lock for job ${jobKey}`)
            throw new JobAcquisitionFailure(`Failed to acquire lock for job ${jobKey}`)
        }
        try {
            await this.redisClientPool.run(async (redisClient) => {
                const currentWorker = await redisClient.hget(this.jobToWorkerKey, jobKey)
                if (currentWorker) {
                    if (currentWorker === workerKey) {
                        this.logger.log('debug', `${currentWorker} already has job ${jobKey}`)
                        return
                    }
                    if (!acquireFrom) {
                        throw new JobAcquisitionFailure(`Worker ${workerKey} can't take job ${jobKey} as it is already being worked by ${currentWorker}`)
                    } else if (currentWorker !== acquireFrom) {
                        throw new JobAcquisitionFailure(`Worker ${workerKey} can't take job ${jobKey} from ${acquireFrom} as it is currently being worked by ${currentWorker}`)
                    }
                }

                const pipeline = this.redisClientPool.getMultiOrPipeline(redisClient, true)
                if (acquireFrom && currentWorker) {
                    pipeline.hdel(this.jobToWorkerKey, jobKey)
                    pipeline.srem(this.makeWorkerToJobKey(acquireFrom), jobKey)
                }
                pipeline.hset(this.jobToWorkerKey, jobKey, workerKey)
                pipeline.sadd(this.makeWorkerToJobKey(workerKey), jobKey)
                try {
                    await pipeline.exec()
                } catch (e) {
                    this.logger.log('error', e)
                    throw new JobAcquisitionFailure(`Failed to set job info for job ${jobKey} on worker ${workerKey}`)
                }
            })
        } finally {
            lock.release()
        }
        this.logger.log('verbose', `${workerKey} acquired job ${jobKey}`)
    }

    async getAllJobsForWorker(workerKey: string, pipeline?: ChainableCommander) {
        return this.redisClientPool.smembers(this.makeWorkerToJobKey(workerKey), pipeline)
    }

    async getAllJobsForWorkers(workerKeys: string[], pipeline?: ChainableCommander): Promise<[workerId: string, jobId: string][]> {
        if (workerKeys.length === 0) {
            return []
        }
        const results = await this.redisClientPool.runForcePipeline((pipeline) => {
            return Promise.all(workerKeys.map((workerKey) => this.redisClientPool.smembers(this.makeWorkerToJobKey(workerKey), pipeline)))
        }, pipeline)
        const toReturn: [string, string][] = []
        results.forEach((jobs, index) => {
            if (!jobs || jobs.length === 0 || !Array.isArray(jobs)) {
                return
            }
            const workerKey = workerKeys[index]
            const pairs: [string, string][] = jobs.map((job) => {
                return [workerKey, job]
            })
            toReturn.push(...pairs)
        })
        return toReturn
    }

    async getWorkerForJob(jobKey: string, pipeline?: ChainableCommander) {
        return this.redisClientPool.hget(this.jobToWorkerKey, jobKey, pipeline)
    }

    async hasJob(jobKey: string, workerKey: string) {
        const workerForJob = await this.getWorkerForJob(jobKey)
        return workerForJob === workerKey
    }

    async releaseJob(jobKey: string, workerKey: string) {
        this.logger.log('info', `Worker ${workerKey} releasing job ${jobKey}`)
        const lockKey = `${this.redisClientPool.makeBaseRedisKey('lock')}:${jobKey}`
        let lock
        try {
            lock = await this.redisClientPool.redlock.acquire([lockKey], 3000, {
                ...this.redisClientPool.redlock.settings,
                retryCount: 30
            })
        } catch (e) {
            this.logger.log('debug', `Failed to acquire lock to release job ${jobKey}`)
            return
        }
        try {
            await this.redisClientPool.run(async (redisClient) => {
                const currentWorker = await redisClient.hget(this.jobToWorkerKey, jobKey)
                if (currentWorker && currentWorker !== workerKey) {
                    this.logger.log('debug', `Failed to release lock for job ${jobKey} as the existing worker ${currentWorker} is not ${workerKey}`)
                    return
                }
                const pipeline = this.redisClientPool.getMultiOrPipeline(redisClient, true)
                pipeline.hdel(this.jobToWorkerKey, jobKey)
                pipeline.srem(this.makeWorkerToJobKey(workerKey), jobKey)
                try {
                    await pipeline.exec()
                } catch (e) {
                    this.logger.log('error', e)
                }
                this.logger.log('info', `Worker ${workerKey} released job ${jobKey}`)
            })
        } finally {
            lock.release()
        }
    }

    async getWorkerToJobs(pipeline?: ChainableCommander) {
        const jobToWorkers = await this.redisClientPool.hgetall(this.jobToWorkerKey, pipeline)
        const toReturn = new Map<string, string[]>()
        Object.entries(jobToWorkers).forEach(([job, worker]) => {
            let jobArray = toReturn.get(worker)
            if (!jobArray) {
                jobArray = []
                toReturn.set(worker, jobArray)
            }
            jobArray.push(job)
        })
        return toReturn
    }
}