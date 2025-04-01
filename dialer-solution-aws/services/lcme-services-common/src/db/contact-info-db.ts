import { plainToClass } from 'class-transformer';
import { transformAndValidate } from 'class-transformer-validator';
import { ChainableCommander } from 'ioredis';
import { OutboundContactInfo } from 'lcme-common/lib/models/outbound-contact-info';
import { Logger } from '../logger/logger';
import { RedisClientPool, ZScoreOpt } from './redis-client-pool';
import { DbIntegrityCheckOptions } from '../config/db-integrity-check';
import e from 'express';
import { UnreferencedKeyBehaviour } from '../config/db-config';

export class ContactInfoDb {
  private readonly logger = Logger.getLogger();

  private readonly contactInfoKeyBase: string;
  private readonly contactInfoKeySetKey: string;

  constructor(private readonly redisClientPool: RedisClientPool) {
    this.contactInfoKeyBase = redisClientPool.makeBaseRedisKey('contact_info');
    this.contactInfoKeySetKey = redisClientPool.makeBaseRedisKey('contact_info_keys');
  }

  private makeContactInfoKey(contactId: string) {
    return `${this.contactInfoKeyBase}:${contactId}`;
  }

  public async removeOutboundContactInfo(contactId: string | string[], pipeline?: ChainableCommander) {
    const contactIds = Array.isArray(contactId) ? contactId : [contactId];
    const keys = contactIds.map((contactId) => this.makeContactInfoKey(contactId));
    await this.redisClientPool.runForcePipeline(
      (pipeline) =>
        Promise.all([
          this.redisClientPool.del(keys, pipeline),
          this.redisClientPool.zrem(this.contactInfoKeySetKey, keys, pipeline),
        ]),
      pipeline
    );
  }

  public async getOutboundContactInfo(
    contactId: string,
    pipeline?: ChainableCommander
  ): Promise<OutboundContactInfo | null> {
    const key = this.makeContactInfoKey(contactId);
    const plain = this.redisClientPool.jsonGetObject(key, pipeline);
    try {
      return await transformAndValidate(OutboundContactInfo, plain);
    } catch (e) {
      this.logger.log('warn', `Failed to validate OutboundContactInfo for contact ${contactId}: ${e}`);
      return null;
    }
  }

  public async setOutboundContactInfo(
    outboundContactInfo: OutboundContactInfo,
    onCompleteAction: 'mark_ready' | 'delete',
    setPipeline?: ChainableCommander
  ) {
    const contactId = outboundContactInfo.contactId;
    const contactInfoKey = this.makeContactInfoKey(contactId);
    const currentValue = await this.redisClientPool.runForcePipeline((pipeline) => {
      this.redisClientPool.zaddOpt(this.contactInfoKeySetKey, 'NX', Date.now(), contactInfoKey, pipeline);
      this.redisClientPool.jsonUpdate(
        contactInfoKey,
        '.',
        JSON.stringify({
          contactId,
        }),
        'NX',
        pipeline
      );
      for (const [key, value] of Object.entries(outboundContactInfo)) {
        if (key === 'contactId') {
          continue;
        }
        this.redisClientPool.jsonUpdate(contactInfoKey, `.${key}`, JSON.stringify(value), null, pipeline);
      }
      this.redisClientPool.expire(contactInfoKey, 86400, pipeline);
      return this.redisClientPool.jsonGetObject(contactInfoKey, pipeline);
    }, setPipeline);
    const isComplete =
      currentValue.campaignInfo && currentValue.dispositionInfo && currentValue.startTime ? true : false;
    if (isComplete) {
      if (onCompleteAction === 'mark_ready') {
        await this.redisClientPool.zadd(this.contactInfoKeySetKey, -1, contactInfoKey);
      } else if (onCompleteAction === 'delete') {
        await this.removeOutboundContactInfo(contactId);
      }
    }
    return {
      isComplete,
      contactInfo: plainToClass(OutboundContactInfo, currentValue),
    };
  }

  private async getContactInfosByScore(
    min: ZScoreOpt,
    max: ZScoreOpt,
    pipeline?: ChainableCommander
  ): Promise<OutboundContactInfo[]> {
    const contactInfoKeys = await this.redisClientPool.zrangebyscore(this.contactInfoKeySetKey, min, max, pipeline);
    if (contactInfoKeys.length === 0) {
      return [];
    }
    const contactInfosPlain: any[] = await this.redisClientPool.jsonGetObjectsList(contactInfoKeys);
    const toReturn = await Promise.all(
      contactInfosPlain.map(async (plain) => {
        try {
          return (await transformAndValidate(OutboundContactInfo, plain)) as OutboundContactInfo;
        } catch (e) {
          this.logger.log('warn', `Failed to validate OutboundContactInfo for contact ${plain.contactId}: ${e}`);
          return null;
        }
      })
    );
    return toReturn.filter((contactInfo) => contactInfo) as OutboundContactInfo[];
  }

  async getContactInfosOlderThan(ageMillis: number, pipeline?: ChainableCommander) {
    return this.getContactInfosByScore(0, `(${Date.now() - ageMillis}`, pipeline);
  }

  async getReadyContactInfos(pipeline?: ChainableCommander): Promise<OutboundContactInfo[]> {
    return this.getContactInfosByScore(-1, '(0', pipeline);
  }
  
  public async integrityCheck(integrityCheckOptions: DbIntegrityCheckOptions) {
    if (!integrityCheckOptions.enabled) {
      return;
    }
    this.logger.log('info', `Running contact info DB integrity check`);
    const allKeys = await this.redisClientPool.zrangebyscore(this.contactInfoKeySetKey, '-inf', '+inf');
    const allContactInfos = await this.redisClientPool.jsonGetObjectsListWithEmpties(allKeys);
    const invalidContactKeys = new Set<string>();
    await Promise.allSettled(allContactInfos.map(async(contactInfo, index) => {
      if (!contactInfo) {
        invalidContactKeys.add(allKeys[index]);
      }
      await transformAndValidate(OutboundContactInfo, contactInfo).catch((e) => invalidContactKeys.add(allKeys[index]));
    }))
    if (invalidContactKeys.size === 0) {
      return;
    }
    this.logger.log('info', `Found ${invalidContactKeys.size} invalid contact info keys, removing`);
    const toRemove = [...invalidContactKeys];
    await this.redisClientPool.runForcePipeline(
      (pipeline) =>
        Promise.all([
          this.redisClientPool.del(toRemove, pipeline),
          this.redisClientPool.zrem(this.contactInfoKeySetKey, toRemove, pipeline),
        ]),
    );
  }

}
