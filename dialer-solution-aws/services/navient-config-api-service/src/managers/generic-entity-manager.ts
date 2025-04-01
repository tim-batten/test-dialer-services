import { RedisGenericJsonEntityDb } from 'navient-services-common/lib/db/redis-generic-json-entity-db';
import { DbEntity, Transformable } from 'navient-common/lib/models/db-entity';
import { DependentsInfo, EntityManager } from './entity-manager';
import { ServiceRole } from 'navient-common/lib/types/roles';
import { Logger } from 'navient-services-common/lib/logger/logger';
import { redisClientPool } from '../globals';
import { isString } from 'lodash';
import { ChainableCommander } from 'ioredis';

export const defaultValidCreateRoles: ServiceRole[] = [
  ServiceRole.ADMINISTRATOR,
  ServiceRole.DEVELOPER,
  ServiceRole.ANALYST,
];

export const defaultValidReadRoles: ServiceRole[] = [
  ServiceRole.ADMINISTRATOR,
  ServiceRole.DEVELOPER,
  ServiceRole.ANALYST,
  ServiceRole.READ_ONLY,
];

export const defaultValidUpdateRoles: ServiceRole[] = defaultValidCreateRoles;

export const defaultValidDeleteRoles: ServiceRole[] = defaultValidCreateRoles;

export class GenericEntityManager<T extends DbEntity & Transformable> implements EntityManager<T> {
  protected readonly logger: Logger = Logger.getLogger();
  entityDb: RedisGenericJsonEntityDb<T>;

  constructor(
    entityDb: RedisGenericJsonEntityDb<T>,
    public readonly validCreateRoles = defaultValidCreateRoles,
    public readonly validReadRoles = defaultValidReadRoles,
    public readonly validUpdateRoles = defaultValidUpdateRoles,
    public readonly validDeleteRoles = defaultValidDeleteRoles
  ) {
    this.entityDb = entityDb;
  }

  public getOutOfNamespaceIds(entityDefinition: T) {
    const toReturn: string[] = [];
    if (entityDefinition.id && !redisClientPool.isInNamespace(entityDefinition.id)) {
        toReturn.push(entityDefinition.id);
    }
    entityDefinition
        .getRelatedEntities()
        .forEach(({ entityId, entityRelationship }) => {
            if (entityRelationship.opts?.keyOnly !== true && entityId && (!redisClientPool.isInNamespace(entityId))) {
                toReturn.push(entityId);
            }
        });
    return toReturn;
  }

  public namespaceValidityCheck(entity: T | string) {
    if (isString(entity)) {
      if (!redisClientPool.isInNamespace(entity)) {
        throw `${entity} is not in namespace "${redisClientPool.redisConf.namespace}"`;
      }
    } else {
      const outOfNamespaceIds = this.getOutOfNamespaceIds(entity);
      if (outOfNamespaceIds.length > 0) {
        throw `The following entity IDs in supplied entity were in a different namespace to "${redisClientPool.redisConf.namespace}": ${outOfNamespaceIds}`;
      }
    }
  }

  public async add(entityDefinition: T) {
    this.namespaceValidityCheck(entityDefinition);
    await this.additionalValidation(entityDefinition);
    this.logger.log('info', `Adding entity ${entityDefinition.id}`);
    await this.entityDb.add(entityDefinition);
    return entityDefinition;
  }

  public async update(entityDefinition: T) {
    this.namespaceValidityCheck(entityDefinition);
    await this.additionalValidation(entityDefinition);
    this.logger.log('info', `Updating entity ${entityDefinition.id}`);
    await this.entityDb.set(entityDefinition);
    return entityDefinition;
  }

  public async additionalValidation(entityDefinition: T) {
    return;
  }

  public remove(entityDefinition: T) {
    this.namespaceValidityCheck(entityDefinition);
    this.logger.log('info', `Removing entity ${entityDefinition.id}`);
    return this.entityDb.remove(entityDefinition.id);
  }

  public removeAll() {
    this.logger.log('info', `Removing all entities of type ${this.entityDb.dbBaseName}`);
    return this.entityDb.removeAll();
  }

  public get(entityId: string, pipeline?: ChainableCommander) {
    this.namespaceValidityCheck(entityId);
    return this.entityDb.get(entityId, pipeline);
  }

  public getAll(pipeline?: ChainableCommander) {
    return this.entityDb.getAllAsList(pipeline);
  }

  public async getDependents(entity: T): Promise<DependentsInfo | undefined> {
    return;
  }

  public async cascadeRemove(entityDefinition: T): Promise<DependentsInfo | undefined> {
    throw new Error('Cascade deletion is not supported on this entity type');
  }
}
