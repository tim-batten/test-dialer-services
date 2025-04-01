import { plainToClass } from 'class-transformer';
import { ChainableCommander } from 'ioredis';
import { OutboundContactInfo, OutboundContactInfoObject } from 'navient-common/lib/models/outbound-contact-info';
import { DbIntegrityCheckOptions } from '../config/db-integrity-check';
import { Logger } from '../logger/logger';
import { RedisClientPool, ZScoreOpt } from './redis-client-pool';

export class ContactInfoDb {
  private readonly logger = Logger.getLogger();

  private readonly contactInfoKeyBase: string;
  private readonly contactInfoKeySetKey: string;
  private readonly ringingContactInfoKeySetKey: string;

  constructor(private readonly redisClientPool: RedisClientPool) {
    this.contactInfoKeyBase = redisClientPool.makeBaseRedisKey('contact_info');
    this.contactInfoKeySetKey = redisClientPool.makeBaseRedisKey('contact_info_keys');
    this.ringingContactInfoKeySetKey = redisClientPool.makeBaseRedisKey('ringing_contact_info_keys');
  }

  private makeContactInfoKey(contactId: string) {
    return `${this.contactInfoKeyBase}:${contactId}`;
  }

  public async removeOutboundContactInfo(contactId: string | string[], pipeline?: ChainableCommander) {
    const contactIds = Array.isArray(contactId) ? contactId : [contactId];
    const keys = contactIds.map((contactId) => this.makeContactInfoKey(contactId));
    await this.redisClientPool
      .runForcePipeline(
        (pipeline) =>
          Promise.all([
            this.redisClientPool.del(keys, pipeline),
            this.redisClientPool.zrem(this.contactInfoKeySetKey, keys, pipeline),
            this.redisClientPool.zrem(this.ringingContactInfoKeySetKey, keys, pipeline),
          ]),
        pipeline
      )
      .catch((e) => {
        this.logger.log('error', `Failed to remove contact info for contact ${contactId}: ${e}`);
      });
  }

  public async getOutboundContactInfo(
    contactId: string,
    pipeline?: ChainableCommander
  ): Promise<OutboundContactInfo | null> {
    const key = this.makeContactInfoKey(contactId);
    const plain = this.redisClientPool.jsonGetObject(key, pipeline);
    try {
      return OutboundContactInfo.from(plain);
    } catch (e) {
      this.logger.log('warn', `Failed to validate OutboundContactInfo for contact ${contactId}: ${e}`);
      return null;
    }
  }

  public async setOutboundContactInfo(
    outboundContactInfo: OutboundContactInfoObject,
    opts: {
      onCompleteAction?: 'mark_ready' | 'delete';
      undefinedBehavior?: 'delete' | 'ignore';
      setPipeline?: ChainableCommander;
    }
  ) {
    const { onCompleteAction, undefinedBehavior = 'ignore', setPipeline } = opts;
    const contactId = outboundContactInfo.contactId;
    const contactInfoKey = this.makeContactInfoKey(contactId);
    const currentValue = await this.redisClientPool
      .runForcePipeline((pipeline) => {
        this.redisClientPool.zaddOpt(this.contactInfoKeySetKey, 'NX', Date.now(), contactInfoKey, pipeline);
        if (outboundContactInfo.startTime && !outboundContactInfo.connectedTime) {
          this.redisClientPool.zaddOpt(
            this.ringingContactInfoKeySetKey,
            'NX',
            outboundContactInfo.startTime.getTime(),
            contactInfoKey,
            pipeline
          );
        }
        if (outboundContactInfo.connectedTime) {
          this.redisClientPool.zrem(this.ringingContactInfoKeySetKey, contactInfoKey, pipeline);
        }
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
          if (value) {
            this.redisClientPool.jsonUpdate(contactInfoKey, `.${key}`, JSON.stringify(value), null, pipeline);
          } else if (undefinedBehavior === 'delete') {
            this.redisClientPool.jsonDel(contactInfoKey, `.${key}`, pipeline);
          }
        }
        this.redisClientPool.expire(contactInfoKey, 86400, pipeline);
        return this.redisClientPool.jsonGetObject(contactInfoKey, pipeline);
      }, setPipeline)
      .catch((e) => {
        this.logger.log('error', `Failed to set contact info for contact ${contactId}: ${e}`);
        throw e;
      });
    const isComplete =
      currentValue.campaignInfo && currentValue.dispositionInfo && currentValue.creationTime ? true : false;
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

  private getContactKeysByScore(
    min: ZScoreOpt,
    max: ZScoreOpt,
    type: 'active' | 'ringing',
    opts: {
      pipeline?: ChainableCommander;
      limit?: {
        offset: number;
        count: number;
      };
    } = {}
  ) {
    const { pipeline, limit } = opts;
    const setKey = type === 'active' ? this.contactInfoKeySetKey : this.ringingContactInfoKeySetKey;
    return this.redisClientPool.zrangebyscore(setKey, min, max, { pipeline, limit });
  }

  private async getContactInfosByScore(
    min: ZScoreOpt,
    max: ZScoreOpt,
    type: 'active' | 'ringing',
    opts: {
      pipeline?: ChainableCommander;
      limit?: {
        offset: number;
        count: number;
      };
    } = {}
  ): Promise<OutboundContactInfo[]> {
    const contactInfoKeys = await this.getContactKeysByScore(min, max, type, opts);
    if (contactInfoKeys.length === 0) {
      return [];
    }
    const contactInfosPlain: any[] = await this.redisClientPool.jsonGetObjectsList(contactInfoKeys);
    const toReturn = await Promise.all(
      contactInfosPlain.map(async (plain) => {
        try {
          return OutboundContactInfo.from(plain);
        } catch (e) {
          this.logger.log('warn', `Failed to validate OutboundContactInfo for contact ${plain.contactId}: ${e}`);
          return null;
        }
      })
    );
    return toReturn.filter((contactInfo) => contactInfo) as OutboundContactInfo[];
  }

  async getContactInfosOlderThan(ageMillis: number, pipeline?: ChainableCommander) {
    return this.getContactInfosByScore(0, `(${Date.now() - ageMillis}`, 'active', { pipeline });
  }

  async getReadyContactInfos(pipeline?: ChainableCommander): Promise<OutboundContactInfo[]> {
    return this.getContactInfosByScore(-1, '(0', 'active', { pipeline });
  }

  async getRingingContactInfos(
    opts: {
      /**  Get contacts that have been ringing for at least this amount of time (in milliseconds) */
      longerThan?: number;
      /** Get contacts that have been ringing for at most this amount of time (in milliseconds) */
      shorterThan?: number;
      maxResults?: number;
    },
    pipeline?: ChainableCommander
  ): Promise<OutboundContactInfo[]> {
    const { longerThan = 0, shorterThan = Infinity, maxResults } = opts;
    const now = Date.now();
    return this.getContactInfosByScore(now - shorterThan, now - longerThan, 'ringing', {
      pipeline,
      limit: maxResults ? { offset: 0, count: maxResults } : undefined,
    });
  }

  async clearRingingContacts(longerThan: number, pipeline?: ChainableCommander) {
    const keys = await this.getContactKeysByScore(0, `(${Date.now() - longerThan}`, 'ringing', { pipeline });
    await this.redisClientPool.zrem(this.ringingContactInfoKeySetKey, keys, pipeline);
    return keys;
  }

  public async integrityCheck(integrityCheckOptions: DbIntegrityCheckOptions) {
    if (!integrityCheckOptions.enabled) {
      return;
    }
    this.logger.log('info', `Running contact info DB integrity check`);
    const allKeys = await this.redisClientPool.zrangebyscore(this.contactInfoKeySetKey, '-inf', '+inf');
    const allContactInfos = await this.redisClientPool.jsonGetObjectsListWithEmpties(allKeys);
    const invalidContactKeys = new Set<string>();
    await Promise.allSettled(
      allContactInfos.map(async (contactInfo, index) => {
        if (!contactInfo) {
          invalidContactKeys.add(allKeys[index]);
        }
        try {
          OutboundContactInfo.from(contactInfo);
        } catch (e) {
          invalidContactKeys.add(allKeys[index]);
        }
      })
    );
    if (invalidContactKeys.size === 0) {
      return;
    }
    this.logger.log('info', `Found ${invalidContactKeys.size} invalid contact info keys, removing`);
    const toRemove = [...invalidContactKeys];
    await this.redisClientPool.runForcePipeline((pipeline) =>
      Promise.all([
        this.redisClientPool.del(toRemove, pipeline),
        this.redisClientPool.zrem(this.contactInfoKeySetKey, toRemove, pipeline),
      ])
    );
  }
}
