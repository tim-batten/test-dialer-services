import { RedisClientPool } from '../db/redis-client-pool';
import { RedisHandler } from '../db/redis-handler';

export class DbInstanceManager {
  private static instance: DbInstanceManager;
  private dbMap: Map<string, any> = new Map();
  static init(redisClientPool: RedisClientPool) {
    this.instance = new DbInstanceManager(redisClientPool);
  }
  static getInstance() {
    return this.instance;
  }

  private constructor(readonly redisClientPool: RedisClientPool) {}

  getDbInstance<T>(dbConstructor: new (redisClientPool: RedisClientPool) => T): T {
    const dbInstance = this.dbMap.get(dbConstructor.name);
    if (dbInstance) {
      return dbInstance;
    }
    const newDbInstance = new dbConstructor(this.redisClientPool);
    this.dbMap.set(dbConstructor.name, newDbInstance);
    return newDbInstance;
  }

  getRedisClientPool() {
    return this.redisClientPool;
  }
}