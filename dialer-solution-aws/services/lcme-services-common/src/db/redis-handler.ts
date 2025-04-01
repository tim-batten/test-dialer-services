import { ChainableCommander } from 'ioredis';
import { Logger } from '../logger/logger';
import { RedisClientPool } from './redis-client-pool';
import _ from 'lodash';
import { flatten, unflatten } from 'flat';
import { SafeRecord } from '../utils/general';

export type ChainableCommanderMultiIndicator = ChainableCommander & {
  isMulti: boolean;
};

export class RedisHandler {
  protected readonly logger: Logger = Logger.getLogger();
  protected readonly redisClientPool: RedisClientPool;
  constructor(redisClientPool: RedisClientPool) {
    this.redisClientPool = redisClientPool;
  }

  protected jsonGet(key: string, pipeline?: ChainableCommander) {
    return this.redisClientPool.jsonGet(key, pipeline);
  }

  protected jsonGetField(key: string, field: string, pipeline?: ChainableCommander) {
    return this.redisClientPool.jsonGetField(key, field, pipeline);
  }

  protected jsonMGet(keys: string[], pipeline: ChainableCommander) {
    return this.redisClientPool.jsonMGet(keys, pipeline);
  }

  protected jsonMGetField(keys: string[], path: string, pipeline?: ChainableCommander) {
    return this.redisClientPool.jsonMGetField(keys, path, pipeline);
  }

  protected jsonDel(key: string, pipeline?: ChainableCommander) {
    return this.redisClientPool.jsonDel(key, pipeline);
  }

  protected jsonSet(key: string, value: string, pipeline?: ChainableCommander) {
    return this.redisClientPool.jsonSet(key, value, pipeline);
  }

  jsonUpdate(key: string, path: string, value: string | number, pipeline?: ChainableCommander) {
    return this.redisClientPool.jsonUpdate(key, path, value, undefined, pipeline);
  }

  jsonIncr(key: string, path: string, incrBy: number = 1) {
    return this.redisClientPool.jsonIncr(key, path, incrBy);
  }

  protected jsonGetObject(key: string, pipeline?: ChainableCommander) {
    return this.redisClientPool.jsonGetObject(key, pipeline);
  }

  protected jsonSetObject(key: string, value: any, pipeline?: ChainableCommander) {
    return this.jsonSet(key, JSON.stringify(value), pipeline);
  }

  protected jsonGetFieldObjectsMapWithEmpties(keys: string[], path: string, pipeline?: ChainableCommander) {
    return this.redisClientPool.jsonGetFieldObjectsMapWithEmpties(keys, path, pipeline);
  }

  protected jsonGetObjectsMapWithEmpties(keys: string[], pipeline?: ChainableCommander) {
    return this.redisClientPool.jsonGetObjectsMapWithEmpties(keys, pipeline);
  }

  protected jsonGetObjectsList(keys: string[], pipeline?: ChainableCommander) {
    return this.redisClientPool.jsonGetObjectsList(keys, pipeline);
  }

  protected jsonGetFieldObjectsList(keys: string[], path: string, pipeline?: ChainableCommander) {
    return this.redisClientPool.jsonGetFieldObjectsList(keys, path, pipeline);
  }

  protected jsonGetObjectsListWithEmpties(keys: string[], pipeline?: ChainableCommander) {
    return this.redisClientPool.jsonGetObjectsListWithEmpties(keys, pipeline);
  }

  protected jsonGetFieldObjectsListWithEmpties(keys: string[], path: string, pipeline?: ChainableCommander) {
    return this.redisClientPool.jsonGetFieldObjectsListWithEmpties(keys, path, pipeline);
  }

  public mapToRedisArrayFlat(data: SafeRecord): any[] {
    return Object.entries(flatten(data) as any).reduce((acc, [key, value]) => {
      acc.push(key);
      acc.push(value);
      return acc;
    });
  }

  public redisArrayToObjectUnflat(data: any[]): any {
    const flatObj: any = {};
    for (let i = 0; i < data.length; i += 2) {
      flatObj[data[i]] = data[i + 1];
    }
    return unflatten(flatObj);
  }
}
