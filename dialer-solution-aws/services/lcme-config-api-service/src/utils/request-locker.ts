import { RedisClientPool } from 'lcme-services-common/lib/db/redis-client-pool';
import { Logger } from 'lcme-services-common/lib/logger/logger';

export type LockValue = {
  reqId: string;
  data?: any;
};
export type LockInfo = {
  lockEntityKey: string;
  ttl: number;
  value: LockValue;
};
export type LockResult<T extends string> = {
  lockType: T;
  ok?: LockInfo;
  failed?: LockInfo;
};
const isLockInfo = (lockInfo: any): lockInfo is LockInfo => {
  return lockInfo && lockInfo.lockEntityKey && lockInfo.ttl && lockInfo.value;
};
export class RequestLocker<T extends string> {
  logger = Logger.getLogger();
  lockReqsIncs: { [key in T]: number } = {} as { [key in T]: number };
  constructor(
    readonly redisClientPool: RedisClientPool,
    readonly serviceKey: string,
    readonly lockEntityKeyPrefix: string
  ) {}
  makeLockEntityKey(lockType: T, id: string) {
    return `${this.lockEntityKeyPrefix}:${lockType}:${id}`;
  }
  incrLockReqId(lockType: T) {
    return (this.lockReqsIncs[lockType] = (this.lockReqsIncs[lockType] || 0) + 1);
  }
  private async tryLock(lockType: T, id: string, ttl: number, data: any | null): Promise<LockResult<T>> {
    const lockResult: LockResult<T> = {
      lockType,
    };
    const lockEntityKey = this.makeLockEntityKey(lockType, id);
    await this.redisClientPool.redlock.using([`lock:${lockEntityKey}`], 3000, async (signal) => {
      const lockInfo = await this.getLockInfo(lockType, id);
      const lockTtl = lockInfo ? lockInfo.ttl : 0;
      const value = lockInfo ? lockInfo.value : null;
      if (lockTtl <= 0) {
        const reqId = `req_${this.incrLockReqId(lockType)}_${this.serviceKey}`;
        const lockValue: LockValue = {
          reqId,
          data,
        };
        await this.redisClientPool.run((client) => client.setex(lockEntityKey, ttl, JSON.stringify(lockValue)));
        lockResult.ok = {
          lockEntityKey,
          ttl,
          value: lockValue,
        };
      } else {
        lockResult.failed = {
          lockEntityKey,
          ttl: lockTtl,
          value: value || { reqId: 'Unknown', data: null }
        };
      }
      if (signal.aborted) {
        throw signal.error;
      }
    });
    return lockResult;
  }
  async getLockInfo(lockType: T, id: string): Promise<LockInfo | null> {
    const lockEntityKey = this.makeLockEntityKey(lockType, id);
    const [lockTtl, value] = await this.redisClientPool.runForcePipeline(async (pipeline) => {
      return Promise.all([
        this.redisClientPool.ttl(lockEntityKey, pipeline),
        this.redisClientPool.get(lockEntityKey, pipeline),
      ]);
    });
    if (lockTtl <= 0) {
      return null;
    }
    return {
      lockEntityKey,
      ttl: lockTtl,
      value: this.parseLockValue(value),
    };
  }
  async createLocks(
    toLock: {
      concurrencyLockType: T;
      ttl: number;
      entityId: string;
      data?: any;
    }[]
  ): Promise<{ ok?: { [key in T]?: LockInfo }; failed?: { [key in T]?: LockInfo } }> {
    if (this.logger.isLoggable('verbose')) {
      this.logger.log(
        'verbose',
        `Getting filter validation locks for ${toLock.map((lockParam) => lockParam.concurrencyLockType)}`
      );
    }
    const results = await Promise.all(
      toLock.map((lockParams) =>
        this.tryLock(lockParams.concurrencyLockType, lockParams.entityId, lockParams.ttl, lockParams.data)
      )
    );
    if (results.some((result) => result.failed)) {
      const unlockParams = results.reduce((toUnlock: { lockEntityKey: string; lockReqId: string }[], result) => {
        if (result.ok) {
          toUnlock.push({
            lockEntityKey: result.ok.lockEntityKey,
            lockReqId: result.ok.value.reqId,
          });
        }
        return toUnlock;
      }, []);
      if (unlockParams.length > 0) {
        await this.unlockLocks(...unlockParams);
      }
      return {
        failed: results.reduce((failed: { [key in T]?: LockInfo }, result) => {
          if (result.failed) {
            failed[result.lockType] = result.failed;
          }
          return failed;
        }, {}),
      };
    }
    return {
      ok: results.reduce((ok: { [key in T]?: LockInfo }, result) => {
        if (result.ok) {
          ok[result.lockType] = result.ok;
        }
        return ok;
      }, {}),
    };
  }
  parseLockValue(strVal: string | null): LockValue {
    if (!strVal) {
      return {
        reqId: 'Unknown',
        data: null,
      };
    }
    try {
      return JSON.parse(strVal);
    } catch (e) {
      this.logger.mlog('error', [`Error parsing lock value. Invalid value: ${strVal}`, e]);
      return {
        reqId: 'Unknown',
        data: null,
      };
    }
  }
  async unlockLocks(...toUnlock: ({ lockEntityKey: string; lockReqId: string } | LockInfo)[]) {
    await Promise.all(toUnlock.map((unlock) => this.unlockLock(unlock)));
  }
  async unlockLock(lockInfo: { lockEntityKey: string; lockReqId: string } | LockInfo) {
    this.logger.mlog('verbose', ['Unlocking', lockInfo]);
    const lockEntityKey = lockInfo.lockEntityKey;
    const lockReqId = isLockInfo(lockInfo) ? lockInfo.value.reqId : lockInfo.lockReqId;
    await this.redisClientPool.redlock
      .using([`lock:${lockEntityKey}`], 3000, async (signal) => {
        const currentLockInfo = await this.redisClientPool.run((client) => client.get(lockEntityKey));
        const value = this.parseLockValue(currentLockInfo);
        if (value.reqId === lockReqId) {
          await this.redisClientPool.run((client) => client.del(lockEntityKey));
        } else {
          this.logger.log(
            'verbose',
            `Not unlocking ${lockEntityKey} because the lock req ID ${lockReqId} does not current ${value.reqId}`
          );
        }
        if (signal.aborted) {
          throw signal.error;
        }
      })
      .catch((e) => {
        this.logger.log('error', `Error unlocking ${lockEntityKey}`, e);
      });
  }
}