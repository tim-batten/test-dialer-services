import { EntityRelationshipType } from '../models/db-entity'

type EntityRelationshipOpts = {
    /** 
     * If this is specified it will only have a relationship to a key in the DB and not relate to another actual entity.
     * This is used to inform the DB code not to check for the existence of the related entity or perform any related actions.
     */
    keyOnly?: boolean
}
export class EntityRelationship {
    constructor(readonly entityType1: string,
        readonly entityType2: string,
        readonly type: EntityRelationshipType,
        readonly opts?: EntityRelationshipOpts) {
            entityRelationshipMap.addEntityRelationship(this)
    }
}

class EntityRelationships {
    entityRelationships: Map<string, Map<string, EntityRelationship>> = new Map<string, Map<string, EntityRelationship>>()

    addEntityRelationship(entityRelationship: EntityRelationship) {
        this.addToMap(entityRelationship.entityType1, entityRelationship.entityType2, entityRelationship.type)
        this.addToMap(entityRelationship.entityType2, entityRelationship.entityType1, this.invertRelationshipType(entityRelationship.type))
    }

    private addToMap(entityType1: string, entityType2: string, type: EntityRelationshipType) {
        let map = this.entityRelationships.get(entityType1)
        if (!map) {
            map = new Map<string, EntityRelationship>()
            this.entityRelationships.set(entityType1, map)
        }
        map.set(entityType2, {
            entityType1,
            entityType2,
            type
        })
    }

    getRelationship(entityType1: string, entityType2: string) {
        const type1Map = this.entityRelationships.get(entityType1)
        if (!type1Map) {
            return
        }
        return type1Map.get(entityType2)
    }

    getAllRelationships(entityType: string) {
        const map = this.entityRelationships.get(entityType)
        if (!map) {
            return
        }
        return Array.from(map.values())
    }

    private makeKey(entityType1: string, entityType2: string) {
        return `${entityType1}:${entityType2}`
    }

    private invertRelationshipType(type: EntityRelationshipType) {
        if (type === EntityRelationshipType.MANY_TO_ONE) {
            return EntityRelationshipType.ONE_TO_MANY
        } else if (type === EntityRelationshipType.ONE_TO_MANY) {
            return EntityRelationshipType.MANY_TO_ONE
        }
        return type
    }
}

export const entityRelationshipMap = new EntityRelationships()