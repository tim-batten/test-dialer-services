import { ChainableCommander } from 'ioredis';
import { EntityRelationship, entityRelationshipMap } from 'navient-common/lib/db/entity-relationships';
import { RedisClientPool } from './redis-client-pool';
import { EntityRelationshipType } from 'navient-common/lib/models/db-entity';

export class EntityRelationshipDb {
  private baseRedisKey: string;
  constructor(private redisClientPool: RedisClientPool) {
    this.baseRedisKey = redisClientPool.makeBaseRedisKey('entity_relationships');
  }

  addOneToOneMapping(
    multi: ChainableCommander,
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ) {
    return Promise.all([
      this.mapOneToOne(multi, entity1Id, entity1Type, entity2Id, entity2Type),
      this.mapOneToOne(multi, entity2Id, entity2Type, entity1Id, entity1Type),
    ]);
  }

  addOneToManyMapping(
    multi: ChainableCommander,
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ) {
    return Promise.all([
      this.mapOneToMany(multi, entity1Id, entity1Type, entity2Id, entity2Type),
      this.mapOneToOne(multi, entity2Id, entity2Type, entity1Id, entity1Type),
    ]);
  }

  addManyToOneMapping(
    multi: ChainableCommander,
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ) {
    return this.addOneToManyMapping(multi, entity2Id, entity2Type, entity1Id, entity1Type);
  }

  addManyToManyMapping(
    multi: ChainableCommander,
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ) {
    return Promise.all([
      this.mapOneToMany(multi, entity1Id, entity1Type, entity2Id, entity2Type),
      this.mapOneToMany(multi, entity2Id, entity2Type, entity1Id, entity1Type),
    ]);
  }

  removeOneToOneMapping(
    multi: ChainableCommander,
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ) {
    return Promise.all([
      this.unmapOneToOne(multi, entity1Id, entity1Type, entity2Id, entity2Type),
      this.unmapOneToOne(multi, entity2Id, entity2Type, entity1Id, entity1Type),
    ]);
  }

  removeOneToManyMapping(
    multi: ChainableCommander,
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ) {
    return Promise.all([
      this.unmapOneToMany(multi, entity1Id, entity1Type, entity2Id, entity2Type),
      this.unmapOneToOne(multi, entity2Id, entity2Type, entity1Id, entity1Type),
    ]);
  }

  removeManyToOneMapping(
    multi: ChainableCommander,
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ) {
    return this.removeOneToManyMapping(multi, entity2Id, entity2Type, entity1Id, entity1Type);
  }

  removeManyToManyMapping(
    multi: ChainableCommander,
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ) {
    return Promise.all([
      this.unmapOneToMany(multi, entity1Id, entity1Type, entity2Id, entity2Type),
      this.unmapOneToMany(multi, entity2Id, entity2Type, entity1Id, entity1Type),
    ]);
  }

  mapOneToOne(
    pipeline: ChainableCommander,
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ) {
    const entity1To2Key = this.makeOneToOneKey(entity1Type, entity2Type);
    return this.redisClientPool.hset(entity1To2Key, entity1Id, entity2Id, pipeline);
  }

  mapOneToMany(
    pipeline: ChainableCommander,
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ) {
    const entity1To2Key = this.makeOneToManyKey(entity1Id, entity1Type, entity2Type);
    return this.redisClientPool.sadd(entity1To2Key, entity2Id, pipeline);
  }

  unmapOneToOne(
    pipeline: ChainableCommander,
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ) {
    const entity1To2Key = this.makeOneToOneKey(entity1Type, entity2Type);
    return this.redisClientPool.hdel(entity1To2Key, [entity1Id, entity2Id], pipeline);
  }

  unmapOneToMany(
    pipeline: ChainableCommander,
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ) {
    const entity1To2Key = this.makeOneToManyKey(entity1Id, entity1Type, entity2Type);
    return this.redisClientPool.srem(entity1To2Key, entity2Id, pipeline);
  }

  addEntityRelationship(
    pipeline: ChainableCommander,
    relationship: EntityRelationshipType,
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ) {
    switch (relationship) {
      case EntityRelationshipType.ONE_TO_ONE:
        return this.addOneToOneMapping(pipeline, entity1Id, entity1Type, entity2Id, entity2Type);
      case EntityRelationshipType.ONE_TO_MANY:
        return this.addOneToManyMapping(pipeline, entity1Id, entity1Type, entity2Id, entity2Type);
      case EntityRelationshipType.MANY_TO_ONE:
        return this.addManyToOneMapping(pipeline, entity1Id, entity1Type, entity2Id, entity2Type);
      case EntityRelationshipType.MANY_TO_MANY:
        return this.addManyToManyMapping(pipeline, entity1Id, entity1Type, entity2Id, entity2Type);
    }
  }

  removeEntityRelationship(
    pipeline: ChainableCommander,
    relationship: EntityRelationshipType,
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ) {
    switch (relationship) {
      case EntityRelationshipType.ONE_TO_ONE:
        return this.removeOneToOneMapping(pipeline, entity1Id, entity1Type, entity2Id, entity2Type);
      case EntityRelationshipType.ONE_TO_MANY:
        return this.removeOneToManyMapping(pipeline, entity1Id, entity1Type, entity2Id, entity2Type);
      case EntityRelationshipType.MANY_TO_ONE:
        return this.removeManyToOneMapping(pipeline, entity1Id, entity1Type, entity2Id, entity2Type);
      case EntityRelationshipType.MANY_TO_MANY:
        return this.removeManyToManyMapping(pipeline, entity1Id, entity1Type, entity2Id, entity2Type);
    }
  }

  removeEntityRelationshipMap(
    pipeline: ChainableCommander,
    entity1Id: string,
    entity1Type: string,
    entity2Type: string
  ) {
    const key = this.makeOneToManyKey(entity1Id, entity1Type, entity2Type);
    return this.redisClientPool.del(key, pipeline);
  }

  makeOneToManyKey(entity1Id: string, entity1Type: string, entity2Type: string) {
    return `${this.makeOneToManyBaseKey(entity1Type, entity2Type)}:${entity1Id}`;
  }

  makeOneToManyBaseKey(entityType: string, entityType2: string) {
    return `${this.baseRedisKey}:${entityType}_to_${entityType2}_set`;
  }

  makeOneToOneKey(entity1Type: string, entity2Type: string) {
    return `${this.baseRedisKey}:${entity1Type}_to_${entity2Type}_map`;
  }

  makeEntityRelationshipKeys(
    entity1Id: string,
    entity1Type: string,
    entity2Id: string,
    entity2Type: string
  ): [entity1To2Key: string, entity2To1Key: string] {
    const entity1ToEntity2Key = this.makeOneToManyKey(entity1Id, entity1Type, entity2Type);
    const entity2ToEntity1Key = this.makeOneToManyKey(entity2Id, entity2Type, entity1Type);
    return [entity1ToEntity2Key, entity2ToEntity1Key];
  }

  async getManyRelationshipFor(
    entity1Id: string,
    entity1Type: string,
    entity2Type: string,
    pipeline?: ChainableCommander
  ) {
    const entity1ToEntity2Key = this.makeOneToManyKey(entity1Id, entity1Type, entity2Type);
    return this.redisClientPool.smembers(entity1ToEntity2Key, pipeline);
  }

  async countManyRelationshipFor(
    entity1Id: string,
    entity1Type: string,
    entity2Type: string,
    pipeline?: ChainableCommander
  ) {
    const entity1ToEntity2Key = this.makeOneToManyKey(entity1Id, entity1Type, entity2Type);
    return this.redisClientPool.scard(entity1ToEntity2Key, pipeline);
  }

  async getSingleRelationshipFor(
    entity1Id: string,
    entity1Type: string,
    entity2Type: string,
    pipeline?: ChainableCommander
  ) {
    const result = await this.getSingleRelationshipsFor([entity1Id], entity1Type, entity2Type, false, pipeline);
    return result ? (result.length === 0 ? null : result[0]) : null;
  }

  async getAllSingleRelationshipsBetween(entity1Type: string, entity2Type: string, pipeline?: ChainableCommander) {
    return this.redisClientPool.hgetall(this.makeOneToOneKey(entity1Type, entity2Type), pipeline);
  }

  async getSingleRelationshipsFor(
    entityIds: string[],
    entity1Type: string,
    entity2Type: string,
    filterNull: boolean = false,
    pipeline?: ChainableCommander
  ) {
    if (entityIds.length === 0) {
      return [];
    }
    const entity1ToEntity2Key = this.makeOneToOneKey(entity1Type, entity2Type);
    const result =
      entityIds.length === 1
        ? [await this.redisClientPool.hget(entity1ToEntity2Key, entityIds[0], pipeline)]
        : await this.redisClientPool.hmget(entity1ToEntity2Key, entityIds, pipeline);
    return filterNull ? result.filter((value) => value) : result;
  }

  async getRelatedEntitiesOfType(
    entity1Id: string,
    entity1Type: string,
    entity2Type: string,
    filterNull: boolean = false,
    pipeline?: ChainableCommander
  ) {
    const entityRelationship = entityRelationshipMap.getRelationship(entity1Type, entity2Type);
    if (!entityRelationship) {
      return;
    }
    return this.getRelatedEntities(entity1Id, entityRelationship, filterNull, pipeline) as Promise<string[]>;
  }

  async countRelatedEntitiesOfType(
    entity1Id: string,
    entity1Type: string,
    entity2Type: string,
    pipeline?: ChainableCommander
  ) {
    const entityRelationship = entityRelationshipMap.getRelationship(entity1Type, entity2Type);
    if (
      !entityRelationship ||
      entityRelationship.type === EntityRelationshipType.MANY_TO_ONE ||
      entityRelationship.type === EntityRelationshipType.ONE_TO_ONE
    ) {
      return;
    }
    return this.countManyRelationshipFor(entity1Id, entity1Type, entity2Type, pipeline);
  }

  private async getRelatedEntities(
    entityId: string,
    entityRelationship: EntityRelationship,
    filterNull: boolean = false,
    pipeline?: ChainableCommander
  ) {
    if (
      entityRelationship.type === EntityRelationshipType.MANY_TO_ONE ||
      entityRelationship.type === EntityRelationshipType.ONE_TO_ONE
    ) {
      return this.getSingleRelationshipsFor(
        [entityId],
        entityRelationship.entityType1,
        entityRelationship.entityType2,
        filterNull,
        pipeline
      );
    } else {
      return this.getManyRelationshipFor(
        entityId,
        entityRelationship.entityType1,
        entityRelationship.entityType2,
        pipeline
      );
    }
  }

  async getAllRelatedEntities(
    entity1Id: string,
    entity1Type: string,
    filterNull: boolean = false,
    pipeline?: ChainableCommander
  ) {
    const allRelationships = entityRelationshipMap.getAllRelationships(entity1Type);
    if (!allRelationships) {
      return;
    }
    const result = await this.redisClientPool.runForcePipeline((pipeline) => {
      return Promise.all([
        ...allRelationships.map((relationship) =>
          this.getRelatedEntities(entity1Id, relationship, filterNull, pipeline)
        ),
      ]);
    }, pipeline);
    return result.map((entities, index) => {
      return {
        entityType: allRelationships[index].entityType2,
        entities,
      };
    });
  }

  async removeAllRelationshipsFor(entity1Id: string, entity1Type: string, pipeline?: ChainableCommander) {
    const allRelationships = entityRelationshipMap.getAllRelationships(entity1Type);
    if (!allRelationships) {
      return;
    }
    const relatedEntities = await this.redisClientPool.runForcePipeline((pipeline) => {
      return Promise.all([
        ...allRelationships.map((relationship) => this.getRelatedEntities(entity1Id, relationship, false, pipeline)),
      ]);
    }, pipeline);
    await this.redisClientPool.runForcePipeline((pipeline) => {
      return Promise.all([
        ...allRelationships.map(async (entityRelationship, index) => {
          const relatedEntityIds = relatedEntities[index].filter((entity2Id) => entity2Id) as string[];
          return Promise.all([
            ...relatedEntityIds.map((entity2Id) => {
              this.removeEntityRelationship(
                pipeline,
                entityRelationship.type,
                entity1Id,
                entity1Type,
                entity2Id,
                entityRelationship.entityType2
              );
            }),
          ]);
        }),
      ]);
    });
  }
}
