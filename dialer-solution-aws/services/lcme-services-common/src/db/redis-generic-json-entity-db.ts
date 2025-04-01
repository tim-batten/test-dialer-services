import { classToPlain, Exclude } from 'class-transformer';
import { RedisHandler } from './redis-handler';
import { RedisClientPool } from './redis-client-pool';
import { EntityRelationshipDb } from './entity-relationship-db';
import { scanPipelineResultForErrors } from '../utils/redis-helper';
import { ChainableCommander } from 'ioredis';
import { UnreferencedKeyBehaviour } from '../config/db-config';
import { DbIntegrityCheckOptions } from '../config/db-integrity-check';
import { keysIn } from 'lodash';
import { DbEntity, DependencyRelationship, Transformable } from 'lcme-common/lib/models/db-entity';

type EntityRelationshipGetOpts = {
  pipeline?: ChainableCommander;
  inverse?: boolean;
};

type EntityRelationshipListOpts = EntityRelationshipGetOpts & {
  filterNull?: boolean;
};

export interface DbOptions {}

export type PipelineInjection = (pipeline: ChainableCommander) => any | Promise<any>;

const defaultOptions: DbOptions = {};

export abstract class RedisGenericJsonEntityDb<T extends DbEntity & Transformable> extends RedisHandler {
  dbBaseName: string;
  entityRelationshipDb: EntityRelationshipDb;
  idIncrKey: string;
  keySetKey: string;
  entityBuilder: (entityObj: any) => T;
  opts: DbOptions;

  constructor(
    redisClientPool: RedisClientPool,
    readonly dbEntityType: string,
    entityBuilder: (entityObj: any) => T,
    opts?: DbOptions
  ) {
    super(redisClientPool);
    this.entityRelationshipDb = new EntityRelationshipDb(redisClientPool);
    this.opts = { ...defaultOptions, ...opts };
    this.dbBaseName = redisClientPool.makeBaseRedisKey(dbEntityType);
    this.idIncrKey = `${this.dbBaseName}.id`;
    this.keySetKey = `${this.dbBaseName}.keys`;
    this.entityBuilder = entityBuilder;
  }

  public async get(entityId: string, pipeline?: ChainableCommander) {
    entityId = this.ensureEntityId(entityId);
    const entityObj = await this.jsonGetObject(entityId, pipeline);
    if (!entityObj) {
      return;
    }
    try {
      return this.entityBuilder(entityObj);
    } catch (e) {
      this.logger.log('info', `Unable to get entity ${entityId} as it has failed validation: ${e}`);
    }
  }

  public async mgetListWithEmpties(entityIds: string[], pipeline?: ChainableCommander) {
    entityIds = entityIds.map((entityId) => this.ensureEntityId(entityId));
    if (entityIds.length == 0) {
      return [];
    }
    const entityObjs = await this.jsonGetObjectsListWithEmpties(entityIds, pipeline);
    if (!entityObjs) {
      return [];
    }
    return entityObjs.map((value, index) => {
      if (value) {
        try {
          const converted = this.entityBuilder(value);
          return converted;
        } catch (e) {
          this.logger.log('error', `An invalid entity with key ${entityIds[index]} was found in mget result: ${e}`);
        }
      }
      return undefined;
    });
  }

  public async mgetList(entityIds: string[], pipeline?: ChainableCommander): Promise<T[]> {
    return (await this.mgetListWithEmpties(entityIds, pipeline)).filter((entity) => entity) as T[];
  }

  protected beforeCreateBeforeId(entityDefinition: Omit<T, 'id'>): void | Promise<void> {}

  protected beforeCreateAfterId(entityDefinition: T): void | Promise<void> {}

  protected beforeUpdate(oldEntity: T, newEntity: T): void | Promise<void> {}

  protected beforeRemove(entityDefinition: T): void | Promise<void> {}

  protected afterCreate(entityDefinition: T): void | Promise<void> {}

  protected afterUpdate(entityDefinition: T): void | Promise<void> {}

  protected afterRemove(entityDefinition: T): void | Promise<void> {}

  public async mgetMapWithEmpties(
    entityIds: string[],
    pipeline?: ChainableCommander
  ): Promise<Map<string, T | undefined>> {
    const toReturn = new Map<string, T | undefined>();
    entityIds = entityIds.map((entityId) => this.ensureEntityId(entityId));
    if (entityIds.length == 0) {
      return toReturn;
    }
    const entityObjs = await this.jsonGetObjectsMapWithEmpties(entityIds, pipeline);
    if (!entityObjs) {
      return toReturn;
    }
    entityObjs.forEach((value, key) => {
      if (value) {
        try {
          const converted = this.entityBuilder(value);
          toReturn.set(key, converted);
          return;
        } catch (e) {
          this.logger.log('error', `An invalid entity with key ${key} was found in mget result: ${e}`);
        }
      }
      toReturn.set(key, undefined);
    });
    return toReturn;
  }

  public async mgetMap(entityIds: string[], pipeline?: ChainableCommander): Promise<Map<string, T>> {
    const withEmpties = await this.mgetMapWithEmpties(entityIds, pipeline);
    const toReturn = new Map<string, T>();
    for (const [entityId, entity] of withEmpties) {
      if (entity) {
        toReturn.set(entityId, entity);
      }
    }
    return toReturn;
  }

  protected validateEntityChangesBeforeUpdate(
    previousValue: T,
    newValue: T
  ): string | undefined | null | void | Promise<string | undefined | null | void> {}

  private async setEntity(entityDefinition: T, pipelineInjection?: PipelineInjection) {
    const isCreate = Boolean(entityDefinition.id);
    let entityRelationships = entityDefinition.getRelatedEntities();
    const dependencies = [...entityRelationships]
      .filter(
        (entityRelationship) =>
          entityRelationship.skipDependencyCheck !== true &&
          entityRelationship.entityRelationship.opts?.keyOnly !== true
      )
      .map((entityRelationship) => entityRelationship.entityId);
    if (entityDefinition.id) {
      dependencies.push(entityDefinition.id);
    }
    const pipelineResults = await this.redisClientPool.execIfExists(async (pipeline: ChainableCommander) => {
      let existingEntityRelationships;
      let entityRelationshipsToAdd = entityRelationships;
      let entityRelationshipsToRemove: DependencyRelationship[] = [];
      if (entityDefinition.id) {
        //This is an existing entity and we may need to remove entity relationships if any have been removed during the patch
        const existingEntity = await this.get(entityDefinition.id);
        if (!existingEntity) {
          // This should never happen
          throw new Error(`Entity ${entityDefinition.id} does not exist`);
        }
        const changeErrors = await this.validateEntityChangesBeforeUpdate(existingEntity, entityDefinition);
        if (changeErrors) {
          this.logger.log('info', `Entity ${entityDefinition.id} failed validation on update: ${changeErrors}`);
          throw new Error(changeErrors);
        }
        await this.beforeUpdate(existingEntity, entityDefinition);
        entityRelationships = entityDefinition.getRelatedEntities();
        entityRelationshipsToAdd = entityRelationships;
        existingEntityRelationships = existingEntity.getRelatedEntities();
        const existingEntityRelationshipIds = existingEntityRelationships.map(
          (entityRelationship) => entityRelationship.entityId
        );
        const newEntityRelationshipIds = entityRelationships.map((entityRelationship) => entityRelationship.entityId);
        entityRelationshipsToAdd = entityRelationships.filter(
          (entityRelationship) => !existingEntityRelationshipIds.includes(entityRelationship.entityId)
        );
        entityRelationshipsToRemove = existingEntityRelationships.filter(
          (entityRelationship) => !newEntityRelationshipIds.includes(entityRelationship.entityId)
        );
      } else {
        //This is a new entity and the ID needs generating
        await this.beforeCreateBeforeId(entityDefinition);
        const id = await this.generateId();
        const entityId = this.makeEntityId(id);
        entityDefinition.id = entityId;
        await this.beforeCreateAfterId(entityDefinition);
        entityRelationships = entityDefinition.getRelatedEntities();
        entityRelationshipsToAdd = entityRelationships;
      }
      entityRelationshipsToAdd.forEach((relationship) => {
        this.entityRelationshipDb.addEntityRelationship(
          pipeline,
          relationship.entityRelationship.type,
          entityDefinition.id,
          this.dbEntityType,
          relationship.entityId,
          relationship.entityRelationship.entityType2
        );
      });
      entityRelationshipsToRemove.forEach((relationship) => {
        this.entityRelationshipDb.removeEntityRelationship(
          pipeline,
          relationship.entityRelationship.type,
          entityDefinition.id,
          this.dbEntityType,
          relationship.entityId,
          relationship.entityRelationship.entityType2
        );
      });
      const jsonStr = JSON.stringify(entityDefinition.toPlain());
      pipeline.sadd(this.keySetKey, entityDefinition.id);
      pipeline.call('JSON.SET', entityDefinition.id, '.', jsonStr);
      if (pipelineInjection) {
        await pipelineInjection(pipeline);
      }
      return pipeline.exec();
    }, ...dependencies);
    scanPipelineResultForErrors(pipelineResults!, true);
    if (isCreate) {
      await this.afterCreate(entityDefinition);
    } else {
      await this.afterUpdate(entityDefinition);
    }
    return pipelineResults;
  }

  public async add(entityDefinition: T, pipelineInjection?: PipelineInjection) {
    const addResult = await this.setEntity(entityDefinition, pipelineInjection);
    this.logger.log('debug', `Added entity ${entityDefinition.id}`, { entityId: entityDefinition.id });
    return entityDefinition.id;
  }

  public async set(entityDefinition: T, pipelineInjection?: PipelineInjection) {
    if (!entityDefinition.id) {
      throw new Error('Cannot set entity without ID');
    }
    entityDefinition.id = this.ensureEntityId(entityDefinition.id);
    await this.setEntity(entityDefinition, pipelineInjection);
    return entityDefinition;
  }

  public async generateId() {
    return await this.redisClientPool.run((redisClient) => {
      return redisClient.incr(this.idIncrKey);
    });
  }

  public async remove(id: string, pipelineInjection?: PipelineInjection): Promise<void> {
    let existingEntity: T | undefined;
    let error: any = undefined;
    const result = await this.redisClientPool
      .execIfExists(async (multi: ChainableCommander) => {
        existingEntity = await this.get(id);
        if (!existingEntity) {
          // This should never happen
          throw new Error(`Entity ${id} does not exist`);
        }
        await this.beforeRemove(existingEntity);
        const relatedKeys = this.getSimultaneousDeleteEntityKeys(id);
        multi.del(id, ...relatedKeys);
        multi.srem(this.keySetKey, id);
        const relatedHashes = this.getRelatedHashesAndKey(id);
        relatedHashes.forEach(([hashKey, fieldName]) => {
          multi.hdel(hashKey, fieldName);
        });
        if (pipelineInjection) {
          pipelineInjection(multi);
        }
        return Promise.all([
          this.entityRelationshipDb.removeAllRelationshipsFor(id, this.dbEntityType, multi),
          multi.exec(),
        ]);
      }, id)
      .catch((e) => {
        this.logger.log('error', e.message);
        error = e;
      });
    if (error) {
      throw error;
    }
    existingEntity && (await this.afterRemove(existingEntity));
  }

  public async mremove(ids: string[]) {
    const result = await Promise.allSettled([...ids.map((id) => this.remove(id))]);
    return result.filter((r) => r.status === 'fulfilled').length;
  }

  public async removeAll(): Promise<number> {
    const allKeys = await this.getAllKeys();
    if (allKeys.length === 0) {
      return 0;
    }
    return this.mremove(allKeys);
  }

  public getAllAsList(pipeline?: ChainableCommander) {
    return this.getAllKeys(pipeline).then((keys) => {
      return this.mgetList(keys);
    });
  }

  public getAllAsMap(pipeline?: ChainableCommander) {
    return this.getAllKeys(pipeline).then((keys) => {
      return this.mgetMap(keys);
    });
  }

  public async getAllKeys(pipeline?: ChainableCommander) {
    return this.redisClientPool.smembers(this.keySetKey, pipeline);
  }

  public async integrityCheck(integrityCheckOptions: DbIntegrityCheckOptions) {
    this.logger.log(
      'info',
      `Performing integrity check for ${this.dbEntityType} with options: ${JSON.stringify(integrityCheckOptions)}`
    );
    const [allKeys, allSetMembers] = await Promise.all([
      this.redisClientPool.getKeysMatching(`${this.dbBaseName}:*`),
      this.getAllKeys(),
    ]);
    const allNonExistentEntities: string[] = [];
    let allActualKeys;
    const entityObjs = await this.redisClientPool.runForcePipeline((pipeline) => {
      if (integrityCheckOptions.unreferencedKeyBehaviour !== UnreferencedKeyBehaviour.NONE) {
        const unreferencedKeys = allKeys.filter((key) => !allSetMembers.includes(key));
        if (unreferencedKeys.length > 0) {
          if (integrityCheckOptions.unreferencedKeyBehaviour === UnreferencedKeyBehaviour.REINSTATE) {
            this.logger.log(
              'info',
              `Found ${unreferencedKeys.length} keys that are not referenced in keys set; reinstating. Key list: ${unreferencedKeys}`
            );
            pipeline.sadd(this.keySetKey, unreferencedKeys);
            allSetMembers.push(...unreferencedKeys);
          } else if (integrityCheckOptions.unreferencedKeyBehaviour === UnreferencedKeyBehaviour.DELETE) {
            this.logger.log(
              'info',
              `Found ${unreferencedKeys.length} keys that are not referenced in keys set; deleting. Key list: ${unreferencedKeys}`
            );
            pipeline.del(unreferencedKeys);
          }
        }
      }
      const nonExistentEntities = allSetMembers.filter((key) => !allKeys.includes(key));
      allNonExistentEntities.push(...nonExistentEntities);
      if (nonExistentEntities.length > 0) {
        this.logger.log(
          'info',
          `Found ${nonExistentEntities.length} keys that are referenced in keys set but do not exist; removing. Key list: ${nonExistentEntities}`
        );
        pipeline.srem(this.keySetKey, nonExistentEntities);
      }
      allActualKeys = allSetMembers.filter((key) => allKeys.includes(key));
      return this.jsonGetObjectsMapWithEmpties(allActualKeys, pipeline);
    });
    const validEntities: T[] = [];
    const invalidEntries: string[] = [];
    entityObjs.forEach((value, key) => {
      if (value) {
        try {
          validEntities.push(this.entityBuilder(value));
          return;
        } catch (e) {}
      }
      invalidEntries.push(key);
    });
    if (invalidEntries.length > 0) {
      this.logger.log('info', `Found ${invalidEntries.length} invalid entries; deleting. Key list: ${invalidEntries}`);
      await this.redisClientPool.runForcePipeline((pipeline) => {
        pipeline.del(invalidEntries);
        return this.redisClientPool.srem(this.keySetKey, invalidEntries, pipeline);
      });
      allActualKeys = allSetMembers.filter((key) => !invalidEntries.includes(key));
    }
    if (allActualKeys && allActualKeys.length > 0) {
      const keys = allActualKeys;
      const toAdd: {
        entity: T;
        entityRelationships: DependencyRelationship[];
      }[] = [];
      for (const entityObj of validEntities) {
        const intendedRelatedEntities = entityObj.getRelatedEntities();
        if (intendedRelatedEntities.length === 0) {
          continue;
        }
        const currentDbRelationships = (await this.getAllRelatedEntities(entityObj.id, true)) || [];
        const relationshipsToAdd = intendedRelatedEntities.filter(
          (intendedRelatedEntity) =>
            (
              currentDbRelationships.find(
                (currentDbRelationship) =>
                  currentDbRelationship.entityType === intendedRelatedEntity.entityRelationship.entityType2
              )?.entities || []
            ).includes(intendedRelatedEntity.entityId) === false
        );
        if (relationshipsToAdd.length > 0) {
          toAdd.push({ entity: entityObj, entityRelationships: relationshipsToAdd });
        }
      }
      if (toAdd.length > 0) {
        await this.redisClientPool.runForcePipeline((pipeline) => {
          const promises: (Promise<[number, number]> | undefined)[] = [];
          toAdd.forEach(({ entity, entityRelationships }) => {
            this.logger.log(
              'info',
              `Found ${entityRelationships.length} missing relationships for entity ${
                entity.id
              }; adding. Relationship list: ${JSON.stringify(entityRelationships, null, 2)}`
            );
            entityRelationships.forEach((entityRelationship) => {
              promises.push(
                this.entityRelationshipDb.addEntityRelationship(
                  pipeline,
                  entityRelationship.entityRelationship.type,
                  entity.id,
                  this.dbEntityType,
                  entityRelationship.entityId,
                  entityRelationship.entityRelationship.entityType2
                )
              );
            });
          });
          return Promise.all(promises);
        });
      }
    }

    const relationshipsToRemove = [...new Set([...allNonExistentEntities, ...invalidEntries])];
    await Promise.allSettled(
      relationshipsToRemove.map((toRemove) =>
        this.entityRelationshipDb.removeAllRelationshipsFor(toRemove, this.dbEntityType)
      )
    );
  }

  /* This is exclusively used for removal and expiry, and is primarily used for deleting/expiring statically related
        entities (e.g. a campaign execution to its queue)
    */
  protected getSimultaneousDeleteEntityKeys(entityId: string): string[] {
    return [];
  }

  /* This is exclusively used for removal and expiry, and is to be used for removing the deleted entity from any hash it may belong to
   */
  protected getRelatedHashesAndKey(entityId: string): [hashKey: string, entityInHashFieldName: string][] {
    return [];
  }

  makeEntityId(entityId: string | number) {
    return this.dbBaseName + ':' + entityId;
  }

  ensureEntityId(entityId: string | number): string {
    if (typeof entityId === 'number' || !entityId.startsWith(this.dbBaseName + ':')) {
      return this.dbBaseName + ':' + entityId;
    }
    return entityId;
  }

  expire(entityId: string, expiryTimeSeconds: number, pipeline?: ChainableCommander) {
    this.logger.log('info', `Setting expiry for ${entityId} to ${expiryTimeSeconds} seconds`);
    const relatedKeys = this.getSimultaneousDeleteEntityKeys(entityId);
    return this.redisClientPool.runForcePipeline(
      (pipeline) =>
        Promise.all([
          this.redisClientPool.expire(entityId, expiryTimeSeconds, pipeline),
          ...relatedKeys.map((key) => this.redisClientPool.expire(key, expiryTimeSeconds, pipeline)),
        ]),
      pipeline
    );
  }

  async getRelatedEntitiesOfType(entityId: string, otherEntityType: string, opts?: EntityRelationshipListOpts) {
    const { pipeline, filterNull = false, inverse = false } = opts || {};
    const typeA = inverse ? otherEntityType : this.dbEntityType;
    const typeB = inverse ? this.dbEntityType : otherEntityType;
    return this.entityRelationshipDb.getRelatedEntitiesOfType(entityId, typeA, typeB, filterNull, pipeline);
  }

  async getSingleRelatedEntityOfType(entityId: string, otherEntityType: string, opts?: EntityRelationshipGetOpts) {
    const { pipeline, inverse = false } = opts || {};
    const typeA = inverse ? otherEntityType : this.dbEntityType;
    const typeB = inverse ? this.dbEntityType : otherEntityType;
    return this.entityRelationshipDb.getSingleRelationshipFor(entityId, typeA, typeB, pipeline);
  }

  async getSingleRelatedEntitiesOfType(
    entityIds: string[],
    otherEntityType: string,
    opts?: EntityRelationshipListOpts
  ) {
    const { pipeline, filterNull = false, inverse = false } = opts || {};
    const typeA = inverse ? otherEntityType : this.dbEntityType;
    const typeB = inverse ? this.dbEntityType : otherEntityType;
    return this.entityRelationshipDb.getSingleRelationshipsFor(entityIds, typeA, typeB, filterNull, pipeline);
  }

  async getAllRelatedEntities(entityId: string, filterNull: boolean = false) {
    return this.entityRelationshipDb.getAllRelatedEntities(entityId, this.dbEntityType, filterNull);
  }
}

export const extractIdNumber = (entityId: string) => {
  return parseInt(entityId.substring(entityId.lastIndexOf(':') + 1)) || -1;
};
