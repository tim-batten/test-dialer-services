import { Router } from "express";
import { makeConfigRouter } from "./config-entity-route-builder";
import { ContactListDefinition } from 'navient-common/lib/models/contact-list'
import { contactListConfigManager } from "../globals";

export function makeContactListRouter(): Router {
    const router = makeConfigRouter(contactListConfigManager, ContactListDefinition.from, 'contactlist', 'contactlists')
    return router
}