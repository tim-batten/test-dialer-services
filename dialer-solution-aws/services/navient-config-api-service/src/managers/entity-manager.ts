import { DbEntity } from "navient-common/lib/models/db-entity";
import { ServiceRole } from 'navient-common/lib/types/roles';

export interface DependentsInfo {
    cascadeDeletable: boolean,
    dependents: any
}

export interface EntityManager<T extends DbEntity> {
    validCreateRoles: ServiceRole[]
    validReadRoles: ServiceRole[]
    validUpdateRoles: ServiceRole[]
    validDeleteRoles: ServiceRole[]

    add: (entity: T) => Promise<T>
    update: (entity: T) => Promise<T>
    remove: (entity: T) => Promise<void>
    removeAll: () => Promise<number>
    get: (id: string) => Promise<T | undefined>
    getAll: () => Promise<T[]>
    getDependents: (entity: T) => Promise<DependentsInfo | undefined>
    cascadeRemove: (entity: T) => Promise<DependentsInfo | undefined>
    namespaceValidityCheck: (entity: T | string) => void
}