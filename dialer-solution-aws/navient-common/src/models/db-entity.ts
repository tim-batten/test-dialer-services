import { Exclude, classToPlain } from 'class-transformer';
import { entityRelationshipMap } from '../db/entity-relationships';

type EntityRelationshipOpts = {
  /**
   * If this is specified it will only have a relationship to a key in the DB and not relate to another actual entity.
   * This is used to inform the DB code not to check for the existence of the related entity or perform any related actions.
   */
  keyOnly?: boolean;
};

export enum EntityRelationshipType {
  ONE_TO_ONE,
  ONE_TO_MANY,
  MANY_TO_ONE,
  MANY_TO_MANY,
}

export class EntityRelationship {
  constructor(
    readonly entityType1: string,
    readonly entityType2: string,
    readonly type: EntityRelationshipType,
    readonly opts?: EntityRelationshipOpts
  ) {
    entityRelationshipMap.addEntityRelationship(this);
  }
}

export type DependencyRelationship = {
  entityId: string;
  entityRelationship: EntityRelationship;
  skipDependencyCheck?: boolean;
};

export interface DbEntity {
  id: string;
  getRelatedEntities: () => DependencyRelationship[];
}

export abstract class Transformable {
  @Exclude()
  toPlain() {
    return classToPlain(this);
  }
}
