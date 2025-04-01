import { ChainableCommander } from 'ioredis';
import { GlobalConfigDefinition } from 'navient-common/lib/models/global-config'
import { ConnectInstanceService } from './connect-instance-service';
import { RedisBackedCache } from './redis-backed-cache';
import _ from 'lodash'
import { AwsCredentialsConfig } from '../config/aws-credentials-config';

export class ConnectInstanceServiceManager {
  private static instance: ConnectInstanceServiceManager;
  public static getInstance() {
    return ConnectInstanceServiceManager.instance;
  }
  serviceMap: Map<string, ConnectInstanceService> = new Map();
  public static async init(
    globalConfigCache: RedisBackedCache<GlobalConfigDefinition>,
    awsCredentialsConfig: AwsCredentialsConfig
  ) {
    ConnectInstanceServiceManager.instance = new ConnectInstanceServiceManager(globalConfigCache, awsCredentialsConfig);
    ConnectInstanceServiceManager.instance.get();
  }
  private constructor(
    readonly globalConfigCache: RedisBackedCache<GlobalConfigDefinition>,
    readonly awsCredentialsConfig: AwsCredentialsConfig
  ) {}
  public async get(pipeline?: ChainableCommander) {
    const globalConfig = await this.globalConfigCache.get(pipeline);
    if (!globalConfig) {
      throw new Error('Unable to get global config from DB');
    }
    let instanceService = this.serviceMap.get(globalConfig.Connect.InstanceId);
    if (instanceService && _.isEqual(instanceService.connectConfig, globalConfig.Connect)) {
      return instanceService;
    }
    instanceService = new ConnectInstanceService(globalConfig.Connect, this.awsCredentialsConfig);
    this.serviceMap.set(globalConfig.Connect.InstanceId, instanceService);
    return instanceService;
  }
}