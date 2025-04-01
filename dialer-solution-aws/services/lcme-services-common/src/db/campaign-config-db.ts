import { PipelineInjection, RedisGenericJsonEntityDb } from './redis-generic-json-entity-db';
import { RedisClientPool } from './redis-client-pool';
import { CampaignDefinition } from 'lcme-common/lib/models/campaign';
import { CampaignGroupConfigDb } from './campaign-group-config-db';
import { ChainableCommander } from 'ioredis';
import { ConnectInstanceService } from '../utils/connect-instance-service';
import { ConnectInstanceServiceManager } from '../utils/connect-helper';
import {
  CreateCampaignCommand,
  DeleteCampaignCommand,
  UpdateCampaignDialerConfigCommand,
  UpdateCampaignOutboundCallConfigCommand,
} from '@aws-sdk/client-connectcampaigns';
import { DbInstanceManager } from '../utils/db-instance-manager';
import { GlobalConfigDb } from './global-config-db';

export class CampaignConfigDb extends RedisGenericJsonEntityDb<CampaignDefinition> {
  campaignGroupDb: CampaignGroupConfigDb;

  constructor(redisClientPool: RedisClientPool) {
    super(redisClientPool, CampaignDefinition.ENTITY_TYPE, CampaignDefinition.dbFrom);
    this.campaignGroupDb = new CampaignGroupConfigDb(redisClientPool);
  }

  async getGroupIds(campaignIds: string[], pipeline?: ChainableCommander): Promise<Map<string, string>> {
    return this.jsonGetFieldObjectsMapWithEmpties(campaignIds, '.BaseConfig.CampaignGroupId', pipeline);
  }

  async validateEntityChangesBeforeUpdate(oldEntity: CampaignDefinition, newEntity: CampaignDefinition) {
    if (oldEntity.ConnectCampaignId !== newEntity.ConnectCampaignId) {
      return 'Cannot change ConnectCampaignId';
    }
  }

  // CONNECT_TODO: Add before update hook to update campaign's caller ID

  protected async beforeCreateAfterId(entityDefinition: CampaignDefinition) {
    this.logger.log('info', `Creating connect campaign for campaign ${entityDefinition.id}`);
    const [{ connectConfig, connectCampaignsClient }, globalConfig] = await Promise.all([
      ConnectInstanceServiceManager.getInstance().get(),
      DbInstanceManager.getInstance().getDbInstance(GlobalConfigDb).cache.get(),
    ]);
    if (!globalConfig) {
      throw new Error('Unable to get global config from DB');
    }
    const connectCampaignName = `${entityDefinition.id} (Dialer Auto Generated - Do Not Delete)`;
    const connectCampaignCommand = new CreateCampaignCommand({
      connectInstanceId: connectConfig.InstanceId,
      name: connectCampaignName,
      dialerConfig: {
        progressiveDialerConfig: {
          bandwidthAllocation: 1,
        },
      },
      outboundCallConfig: {
        connectContactFlowId:
          entityDefinition.BaseConfig.ContactFlowOverride || globalConfig.DialerDefaults.ContactFlowId,
        connectQueueId: entityDefinition.BaseConfig.Queue || undefined,
        connectSourcePhoneNumber: entityDefinition.BaseConfig.Callerid || undefined,
      },
      tags: {
        owner: connectConfig.InstanceArn,
      }
    });
    const result = await connectCampaignsClient.send(connectCampaignCommand);
    if (!result.id) {
      throw new Error(`Unable to create connect campaign for campaign ${entityDefinition.id}`);
    }
    entityDefinition.ConnectCampaignId = result.id;
  }

  protected async beforeUpdate(existing: CampaignDefinition, entityDefinition: CampaignDefinition) {
    const oldCallerId = existing.BaseConfig.Callerid;
    const oldContactFlowId = existing.BaseConfig.ContactFlowOverride;
    const oldQueueId = entityDefinition.BaseConfig.Queue;
    const newCallerId = entityDefinition.BaseConfig.Callerid;
    const newContactFlowId = entityDefinition.BaseConfig.ContactFlowOverride;
    const newQueueId = entityDefinition.BaseConfig.Queue;
    if (!newCallerId && !newContactFlowId && !newQueueId) {
      return;
    }
    if (oldCallerId === newCallerId && oldContactFlowId === newContactFlowId && oldQueueId === newQueueId) {
      return;
    }
    const [{ connectConfig, connectCampaignsClient }, globalConfig] = await Promise.all([
      ConnectInstanceServiceManager.getInstance().get(),
      DbInstanceManager.getInstance().getDbInstance(GlobalConfigDb).cache.get(),
    ]);
    if (!globalConfig) {
      throw new Error('Unable to get global config from DB');
    }
    await connectCampaignsClient.send(
      new UpdateCampaignOutboundCallConfigCommand({
        id: entityDefinition.ConnectCampaignId,
        connectContactFlowId:
          entityDefinition.BaseConfig.ContactFlowOverride || globalConfig.DialerDefaults.ContactFlowId,
        connectSourcePhoneNumber: entityDefinition.BaseConfig.Callerid || undefined,
      })
    );
  }

  protected async beforeRemove(entityDefinition: CampaignDefinition) {
    this.logger.log('info', `Removing connect campaign for campaign ${entityDefinition.id}`);
    const { connectCampaignsClient } = await ConnectInstanceServiceManager.getInstance().get();
    try {
      await connectCampaignsClient.send(
        new DeleteCampaignCommand({
          id: entityDefinition.ConnectCampaignId,
        })
      );
    } catch (e: any) {
      if (e.name === 'ResourceNotFoundException' || e.xAmzErrorType === 'ResourceNotFoundException') {
        this.logger.log(
          'info',
          `Connect campaign ${entityDefinition.ConnectCampaignId} not found; continuing with campaign deletion anyway`
        );
        return;
      }
      throw new Error(
        `Unable to delete connect campaign ${entityDefinition.ConnectCampaignId} for campaign ${entityDefinition.id}: ${e.message}`
      );
    }
  }
}
