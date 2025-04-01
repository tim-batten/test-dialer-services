import { RedisHandler } from './redis-handler';
import { RedisClientPool } from './redis-client-pool';
import { Logger } from '../logger/logger';
import { objectToSafeRecord } from '../utils/general';

export class RedisStreamPublisher extends RedisHandler {
  protected readonly logger: Logger = Logger.getLogger();
  streamName: string;

  constructor(redisClientPool: RedisClientPool, streamName: string) {
    super(redisClientPool);
    const streamPrefix = redisClientPool.redisConf.streamPrefix;
    this.streamName = redisClientPool.makeBaseRedisKey(streamPrefix ? streamPrefix + streamName : streamName);
  }

  protected async addToStream(data: object) {
    const safeData = objectToSafeRecord(data);
    const dataArray = this.mapToRedisArrayFlat(safeData);
    return await this.redisClientPool.run((redisClient) => {
      return redisClient.xadd(this.streamName, 'MAXLEN', '~', 100000, '*', ...dataArray);
    });
  }
}
