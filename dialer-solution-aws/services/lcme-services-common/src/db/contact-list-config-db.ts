import { RedisGenericJsonEntityDb } from "./redis-generic-json-entity-db";
import { RedisClientPool } from "./redis-client-pool";
import { ContactListDefinition } from "lcme-common/lib/models/contact-list";

export class ContactListConfigDb extends RedisGenericJsonEntityDb<ContactListDefinition> {
    constructor(redisClientPool: RedisClientPool) {
        super(redisClientPool, ContactListDefinition.ENTITY_TYPE, ContactListDefinition.from)
    }
}