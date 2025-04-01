import Redlock, { ExecutionResult, Lock, Settings } from "redlock";
import Redis from "ioredis";
import { DbConfig } from "../config/db-config";

const defaultSettings: Partial<Settings> = {
    // The expected clock drift; for more details see:
    // http://redis.io/topics/distlock
    driftFactor: 0.01, // multiplied by lock ttl to determine drift time

    // The max number of times Redlock will attempt to lock a resource
    // before erroring.
    retryCount: 20,

    // the time in ms between attempts
    retryDelay: 200, // time in ms

    // the max time in ms randomly added to retries
    // to improve performance under high contention
    // see https://www.awsarchitectureblog.com/2015/03/backoff.html
    retryJitter: 200, // time in ms

    // The minimum remaining time on a lock before an extension is automatically
    // attempted with the `using` API.
    automaticExtensionThreshold: 500, // time in ms
}

// In case we need to release/extend based on the lock value (e.g. different service extending the same resource)

// export class RedlockExtended extends Redlock {

//     private makeLock(resources: string[], lockValue: string) {
//         return {
//             resources,
//             value: lockValue,
//             expiration: Number.MAX_SAFE_INTEGER
//         } as Lock
//     }

//     releaseX(resources: string[], lockValue: string, settings?: Partial<Settings>): Promise<ExecutionResult> {
//         return this.release(this.makeLock(resources, lockValue), settings)
//     }
//     extendX(resources: string[], lockValue: string, duration: number, settings?: Partial<Settings>): Promise<Lock> {
//         return this.extend(this.makeLock(resources, lockValue), duration, settings)
//     }
// }

export function makeRedlock(dbConf: DbConfig, settings?: Partial<Settings>) {
    const redisClient = new Redis(dbConf as any)
    const settingsToUse = settings ? settings : defaultSettings
    const redlock = new Redlock(
        [redisClient],
        settingsToUse
    )
    return redlock
}