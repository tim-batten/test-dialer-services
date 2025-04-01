import Redis, { ChainableCommander, RedisKey, RedisValue } from 'ioredis';
import { GenericClientPool, GenericPoolFactory } from '../utils/generic-client-pool';
import { DbConfig, KeyHashTagMode } from '../config/db-config';
import Redlock from 'redlock';
import { makeRedlock } from '../utils/redlock-helper';
import { ChainableCommanderMultiIndicator } from './redis-handler';
import { scanPipelineResultForErrors } from '../utils/redis-helper';

export type ZScorePlain = '-inf' | '+inf' | number;
export type ZScore = ZScorePlain | `(${number}`;

export type ZScoreOpt =
  | ZScore
  | {
      score: ZScorePlain;
      inclusive: boolean;
    };
export const makeZScore = (opt: ZScoreOpt): ZScore => {
  if (typeof opt === 'object') {
    let { score, inclusive } = opt;
    if (inclusive) {
      return score;
    }
    return score === '+inf' || score === '-inf' ? score : `(${score}`;
  }
  if (typeof opt === 'number') {
    if (opt === Number.POSITIVE_INFINITY) {
      return '+inf';
    } else if (opt === Number.NEGATIVE_INFINITY) {
      return '-inf';
    }
  }
  return opt;
};

export const invertZScore = (zScore: ZScore): ZScore => {
  if (zScore === '-inf') {
    return '+inf';
  }
  if (zScore === '+inf') {
    return '-inf';
  }
  return -zScore;
};

export const invertMinMax = (minMax: { min: ZScore; max: ZScore }) => {
  return {
    min: invertZScore(minMax.max),
    max: invertZScore(minMax.min),
  };
};

/**  Only add if the member is not already a member of the sorted set. */
export type NX = 'NX';
/** Only add if the member is already a member of the sorted set. */
export type XX = 'XX';
/** Only update elements if the new score is greater than the current score. */
export type GT = 'GT';
/** Only update elements if the new score is less than the current score. */
export type LT = 'LT';
/** Modify the return value from the number of new elements added, to the total number of elements changed (CH is an abbreviation of changed). */
export type CH = 'CH';
/** When this option is specified ZADD acts like ZINCRBY. Only one score-element pair can be specified in this mode. */
export type INCR = 'INCR';

/** ZAdd options:
 * ({@link NX} | {@link XX}) | ({@link GT} | {@link LT}) | {@link CH} | {@link INCR}
 * */
export type ZAddOpt = (NX | XX) | (GT | LT) | CH | INCR;
export type ZAddOptArg = ZAddOpt | ZAddOpt[];

export class RedisClientFactory extends GenericPoolFactory<Redis> {
  redisConf: any;
  constructor(redisConf: any) {
    super();
    this.redisConf = redisConf;
  }

  async createInternal() {
    return new Redis(this.redisConf);
  }

  async destroyInternal(redisClient: Redis) {
    redisClient.disconnect();
  }
}

export class RedisClientPool extends GenericClientPool<Redis> {
  redlock: Redlock;
  private readonly preEntityTypeKeyFragment: string;
  private readonly postEntityTypeKeyFragment: string;

  constructor(public readonly redisConf: DbConfig) {
    super(
      new RedisClientFactory(redisConf),
      redisConf.minClients,
      redisConf.maxClients,
      redisConf.poolAcquireWarningThresholdMs,
      'redis-client-pool'
    );
    this.redlock = makeRedlock(redisConf);
    this.preEntityTypeKeyFragment = this.makePreEntityTypeKeyFragment();
    this.postEntityTypeKeyFragment = redisConf.keyHashTagMode === KeyHashTagMode.NONE ? '' : '}';
    this.on('pool-at-capacity', () => {
      this.logger.log('info', `Redis client pool is at capacity. Pool status: ${this.getPoolStatus()}`);
    });
  }

  generateClient() {
    return this.factory.create();
  }

  makeBaseRedisKey(entityType: string) {
    return `${this.preEntityTypeKeyFragment}${entityType}${this.postEntityTypeKeyFragment}`;
  }

  private makePreEntityTypeKeyFragment() {
    const namespace = this.redisConf.namespace;
    switch (this.redisConf.keyHashTagMode) {
      case KeyHashTagMode.NONE: {
        return `${namespace}:`;
      }
      case KeyHashTagMode.ENTITY_TYPE: {
        return `${namespace}:{`;
      }
      case KeyHashTagMode.NAMESPACE_AND_ENTITY_TYPE: {
        return `{${namespace}:`;
      }
    }
  }

  public async getKeysMatching(pattern: string): Promise<string[]> {
    const count = this.redisConf.keyScanCount;
    if (count === 0) {
      return this.run((redisClient) => {
        return redisClient.keys(pattern);
      });
    }
    const allKeys: string[] = [];
    let nextIdx = 0;
    do {
      nextIdx = await this.run(async (redisClient) => {
        const scanResult = await redisClient.scan(nextIdx, 'MATCH', pattern, 'COUNT', count);
        nextIdx = parseInt(scanResult[0]);
        const entityKeys = scanResult[1];
        allKeys.push(...entityKeys);
        return nextIdx;
      });
    } while (nextIdx > 0);
    return [...new Set(allKeys)];
  }

  public async runForcePipeline<T>(
    toRun: (runner: ChainableCommander) => Promise<T>,
    pipeline?: ChainableCommander,
    opts?: {
      execIfPipelineCreated?: boolean;
    }
  ) {
    const { execIfPipelineCreated = true } = opts || {};
    if (pipeline) {
      return toRun(pipeline);
    } else {
      return this.run(async (redisClient) => {
        const newPipeline = redisClient.pipeline();
        const toReturn = toRun(newPipeline);
        if (execIfPipelineCreated && newPipeline.length > 0) {
          newPipeline.exec().then((result) => {
            const scanResult = scanPipelineResultForErrors(result!);
            if (scanResult.length > 0) {
              this.logger.log(
                'warn',
                `Detected pipeline result error: ${scanResult
                  .map(({ index, error }) => `Command index: ${index}, Error: ${error}`)
                  .join('\n')}`
              );
            }
          });
        }
        return toReturn;
      });
    }
  }

  public async runP<T>(toRun: (runner: Redis | ChainableCommander) => T, pipeline?: ChainableCommander) {
    if (pipeline) {
      return toRun(pipeline);
    } else {
      return this.run(toRun);
    }
  }

  async execIfExists<T>(toRun: (redisClient: ChainableCommander) => T, ...keysThatMustExist: string[]) {
    return this.run(async (redisClient) => {
      if (keysThatMustExist.length === 0) {
        return toRun(redisClient.pipeline());
      }
      const watchExistsPipeline = redisClient.pipeline();
      // Watch removed as it caused MULTI to be abandoned when they shouldn't be
      // if (!this.redisConf.sharded) {
      //      watchExistsPipeline.watch(...keysThatMustExist)
      // }
      keysThatMustExist.forEach((key) => {
        watchExistsPipeline.exists(key);
      });
      let pipelineResult = await watchExistsPipeline.exec();
      if (pipelineResult === null) {
        throw new Error('Pipeline result for watchExistsPipeline was null');
      }
      if (!this.redisConf.sharded) {
        pipelineResult = pipelineResult.splice(1);
      }
      try {
        const nonExistentEntities = pipelineResult
          .map((result, index) => {
            return {
              key: keysThatMustExist[index],
              exists: result[1] === 0 ? false : true,
            };
          })
          .filter((existsResult) => {
            return !existsResult.exists;
          });
        if (nonExistentEntities.length > 0) {
          // if (!this.redisConf.sharded) {
          //     await redisClient.unwatch()
          // }
          throw new RequiredEntitiesDoNotExistError(nonExistentEntities.map((entity) => entity.key));
        }
        return toRun(redisClient.pipeline());
      } catch (e) {
        // if (!this.redisConf.sharded) {
        //     await redisClient.unwatch()
        // }
        throw e;
      }
    });
  }

  isInNamespace(key: string) {
    return key.startsWith(this.preEntityTypeKeyFragment);
  }

  getMultiOrPipeline(redisClient: Redis, sameKeyHashGuaranteed: boolean = false): ChainableCommanderMultiIndicator {
    let toReturn;
    if (sameKeyHashGuaranteed || !this.redisConf.sharded) {
      toReturn = redisClient.multi() as ChainableCommanderMultiIndicator;
      toReturn.isMulti = true;
    } else {
      toReturn = redisClient.pipeline() as ChainableCommanderMultiIndicator;
      toReturn.isMulti = false;
    }
    this.logger.log(
      'silly',
      `getMultiOrPipeline returning ${
        toReturn.isMulti ? 'multi' : 'pipeline'
      }. sameKeyHashGuaranteed: ${sameKeyHashGuaranteed} sharded: ${this.redisConf.sharded}`
    );
    return toReturn;
  }

  async del(keys: string | string[], pipeline?: ChainableCommander) {
    const keysArr = Array.isArray(keys) ? keys : [keys];
    if (keysArr.length === 0) {
      return 0;
    }
    return await this.runP((redisClient) => {
      return new Promise<number>((resolve, reject) =>
        redisClient.del(keysArr, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async expire(key: string, seconds: number, pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<number>((resolve, reject) =>
        redisClient.expire(key, seconds, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async get(key: RedisKey, pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<string | null>((resolve, reject) =>
        redisClient.get(key, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async hset(key: string, field: string, value: string, pipeline?: ChainableCommander) {
    return this.runP((redisClient) => {
      return new Promise<number>((resolve, reject) =>
        redisClient.hset(key, field, value, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async hdel(key: string, field: string | string[], pipeline?: ChainableCommander) {
    const fieldsArr = Array.isArray(field) ? field : [field];
    return this.runP((redisClient) => {
      return new Promise<number>((resolve, reject) =>
        redisClient.hdel(key, ...fieldsArr, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async hget(key: string, field: string, pipeline?: ChainableCommander) {
    return this.runP((redisClient) => {
      return new Promise<string | null>((resolve, reject) =>
        redisClient.hget(key, field, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async hmget(key: string, fields: string[], pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<(string | null)[]>((resolve, reject) =>
        redisClient.hmget(key, ...fields, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async hgetall(key: string, pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<Record<string, string>>((resolve, reject) =>
        redisClient.hgetall(key, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async llen(key: string, pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<number>((resolve, reject) =>
        redisClient.llen(key, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async sadd(key: string, members: string | string[], pipeline?: ChainableCommander) {
    const membersArr = Array.isArray(members) ? members : [members];
    return await this.runP((redisClient) => {
      return new Promise<number>((resolve, reject) =>
        redisClient.sadd(key, membersArr, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async smembers(key: string, pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<string[]>((resolve, reject) =>
        redisClient.smembers(key, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async srem(key: string, toRemove: string | string[], pipeline?: ChainableCommander) {
    const toRemoveArr = Array.isArray(toRemove) ? toRemove : [toRemove];
    return await this.runP((redisClient) => {
      return new Promise<number>((resolve, reject) =>
        redisClient.srem(key, toRemoveArr, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async sort(args: [key: RedisKey, ...args: RedisValue[]], pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<unknown>((resolve, reject) =>
        redisClient.sort(...args, (error, value) => (error === null ? resolve(value) : reject(error)))
      );
    }, pipeline);
  }

  async scard(key: RedisKey, pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<number>((resolve, reject) =>
        redisClient.scard(key, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async ttl(key: RedisKey, pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<number>((resolve, reject) =>
        redisClient.ttl(key, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async zadd(key: RedisKey, score: number, member: string, pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<number>((resolve, reject) =>
        redisClient.zadd(key, score, member, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  /**
   * Adds a member to a sorted set if it doesn't already exist
   * @param key
   * @param opts See {@link ZAddOpt}
   * @param score
   * @param member
   * @param pipeline
   * @returns
   */
  async zaddOpt(key: RedisKey, opts: ZAddOptArg, score: number, member: string, pipeline?: ChainableCommander) {
    const optsArr = Array.isArray(opts) ? opts : [opts];
    return await this.runP((redisClient) => {
      return new Promise<number>((resolve, reject) =>
        redisClient.zadd(key, ...optsArr, score, member, (error, value) =>
          error === null ? resolve(value!) : reject(error)
        )
      );
    }, pipeline);
  }

  async zcard(key: RedisKey, pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<number>((resolve, reject) =>
        redisClient.zcard(key, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async zcount(key: RedisKey, min: string | number, max: string | number, pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<number>((resolve, reject) =>
        redisClient.zcount(key, min, max, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async zrangebyscore(key: RedisKey, min: ZScoreOpt, max: ZScoreOpt, opts: ZRangeByScoreOpts = {}) {
    const { pipeline, withScores, limit } = opts;
    const args: ZRangeByScoreOptsArgs = [key, makeZScore(min), makeZScore(max)];
    if (withScores) {
      args.push('WITHSCORES');
    }
    if (limit) {
      args.push('LIMIT', limit.offset, limit.count);
    }
    const result = await this.runP((redisClient) => {
      return new Promise<string[]>((resolve, reject) => {
        redisClient.zrangebyscore(...args, (error, value) => (error === null ? resolve(value!) : reject(error)));
      });
    }, pipeline);
    return result;
  }

  async zrangebyscoreWithScores(key: RedisKey, min: ZScoreOpt, max: ZScoreOpt, pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<[string, number][]>((resolve, reject) =>
        redisClient.zrangebyscore(key, makeZScore(min), makeZScore(max), 'WITHSCORES', (error, value) =>
          error === null
            ? resolve(
                (value || []).reduce((acc, cur, idx) => {
                  if ((idx & 1) === 0) {
                    acc.push([cur, parseInt(value![idx + 1])]);
                  }
                  return acc;
                }, [] as [string, number][])
              )
            : reject(error)
        )
      );
    }, pipeline);
  }

  async zrem(key: RedisKey, members: string | string[], pipeline?: ChainableCommander) {
    const membersArr = Array.isArray(members) ? members : [members];
    if (membersArr.length === 0) {
      return 0;
    }
    return await this.runP((redisClient) => {
      return new Promise<number>((resolve, reject) =>
        redisClient.zrem(key, membersArr, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async set(key: RedisKey, value: RedisValue, pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<string>((resolve, reject) =>
        redisClient.set(key, value, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async setex(key: RedisKey, seconds: number, value: RedisValue, pipeline?: ChainableCommander) {
    return await this.runP((redisClient) => {
      return new Promise<string>((resolve, reject) =>
        redisClient.setex(key, seconds, value, (error, value) => (error === null ? resolve(value!) : reject(error)))
      );
    }, pipeline);
  }

  async call(command: string, args: (string | number | Buffer)[], pipeline?: ChainableCommander) {
    return this.runP((redisClient) => {
      return new Promise<any>((resolve, reject) =>
        redisClient.call(command, args, (error, value) => (error === null ? resolve(value) : reject(error)))
      );
    }, pipeline);
  }

  public jsonGet(key: string, pipeline?: ChainableCommander) {
    return this.call('JSON.GET', [key], pipeline);
  }

  public jsonGetField(key: string, path: string, pipeline?: ChainableCommander) {
    return this.call('JSON.GET', [key, path], pipeline);
  }

  public jsonMGet(keys: string[], pipeline?: ChainableCommander) {
    return this.jsonMGetField(keys, '.', pipeline);
  }

  public async jsonMGetField(keys: string[], path: string, pipeline?: ChainableCommander) {
    if (keys.length === 0) {
      return [];
    }
    const jsonArray = await this.call('JSON.MGET', [...keys, path], pipeline);
    if (jsonArray === null) {
      return [];
    }
    return jsonArray as string[];
  }

  public async jsonDel(key: string, path?: string, pipeline?: ChainableCommander) {
    return this.call('JSON.DEL', [key, path || '.'], pipeline);
  }

  public async jsonSet(key: string, value: string, pipeline?: ChainableCommander) {
    return this.call('JSON.SET', [key, '.', value], pipeline);
  }

  public async jsonUpdate(
    key: string,
    path: string,
    value: string | number,
    optArg: 'XX' | 'NX' | undefined | null,
    pipeline?: ChainableCommander
  ) {
    const callArgs = [key, path, value];
    optArg && callArgs.push(optArg);
    return this.call('JSON.SET', callArgs, pipeline);
  }

  public async jsonIncr(key: string, path: string, incrBy: number = 1) {
    return this.call('JSON.NUMINCRBY', [key, path, '' + incrBy]);
  }

  public async jsonGetObject(key: string, pipeline?: ChainableCommander): Promise<any | null> {
    const json = await this.jsonGet(key, pipeline);
    if (!json) {
      return null;
    }
    try {
      return JSON.parse(json);
    } catch (e) {
      this.logger.log('info', `Failed to parse ${json}: ${e}`);
      return null;
    }
  }

  public async jsonSetObject(key: string, value: any, pipeline?: ChainableCommander) {
    const json = JSON.stringify(value);
    return await this.jsonSet(key, json, pipeline);
  }

  public async jsonGetFieldObjectsMapWithEmpties(keys: string[], path: string, pipeline?: ChainableCommander) {
    const objList = await this.jsonGetFieldObjectsListWithEmpties(keys, path, pipeline);
    const toReturn = new Map<string, any>();
    objList.forEach((obj, index) => {
      toReturn.set(keys[index], obj);
    });
    return toReturn;
  }

  public async jsonGetObjectsMapWithEmpties(keys: string[], pipeline?: ChainableCommander) {
    return this.jsonGetFieldObjectsMapWithEmpties(keys, '.', pipeline);
  }

  public async jsonGetObjectsList(keys: string[], pipeline?: ChainableCommander) {
    return (await this.jsonGetObjectsListWithEmpties(keys, pipeline)).filter((value) => value);
  }

  public async jsonGetFieldObjectsList(keys: string[], path: string, pipeline?: ChainableCommander) {
    return (await this.jsonGetFieldObjectsListWithEmpties(keys, path, pipeline)).filter((value) => value);
  }

  public async jsonGetObjectsListWithEmpties(keys: string[], pipeline?: ChainableCommander) {
    return this.jsonGetFieldObjectsListWithEmpties(keys, '.', pipeline);
  }

  public async jsonGetFieldObjectsListWithEmpties(keys: string[], path: string, pipeline?: ChainableCommander) {
    if (keys.length === 0) {
      return [];
    }
    const jsonArray = await this.jsonMGetField(keys, path, pipeline);
    if (!jsonArray) {
      return [];
    }
    const toReturn: any[] = [];
    jsonArray.forEach((json, index) => {
      if (json && json.length > 0) {
        try {
          const obj = JSON.parse(json);
          toReturn.push(obj);
        } catch (e) {
          this.logger.mlog('warn', ['Unable to parse value for', keys[index], e]);
          toReturn.push(undefined);
        }
      } else {
        toReturn.push(undefined);
      }
    });
    return toReturn;
  }
}

export class RequiredEntitiesDoNotExistError extends Error {
  constructor(public readonly missingEntities: string[]) {
    super(`The following required entities are missing: ${missingEntities.join(', ')}`);
  }
}

export type ZRangeByScoreOpts = {
  pipeline?: ChainableCommander;
  withScores?: boolean;
  limit?: {
    offset: number;
    count: number;
  };
};

type ZRangeByScoreOptsArgsBase = [key: RedisKey, min: ZScore, max: ZScore];
type ZRangeByScoreOptsArgsWithScores = [...ZRangeByScoreOptsArgsBase, 'WITHSCORES'];
type ZRangeByScoreOptsArgsWithLimit = [...ZRangeByScoreOptsArgsBase, 'LIMIT', number, number];
type ZRangeByScoreOptsArgsWithScoresAndLimit = [...ZRangeByScoreOptsArgsBase, 'WITHSCORES', 'LIMIT', number, number];
type ZRangeByScoreOptsArgs =
  | ZRangeByScoreOptsArgsBase
  | ZRangeByScoreOptsArgsWithScores
  | ZRangeByScoreOptsArgsWithLimit
  | ZRangeByScoreOptsArgsWithScoresAndLimit;
