import { Router, Response } from "express"
import { defaultValidReadRoles } from "../managers/generic-entity-manager"
import { makeAuth } from "../auth/auth"
import { CrudAction } from "./config-entity-route-builder"
import { formatError } from "lcme-services-common/lib/utils/error-helper"
import { entityRelationshipDb } from "../globals"

export function makeEntityRelationshipsRouter(): Router {
    const router = Router()

    router.get('/entityRelationships/:entityType/:entityId/:otherEntityType', makeAuth(CrudAction.READ, ...defaultValidReadRoles), async(req: any, res: Response) => {
        try {
            const { entityType, entityId, otherEntityType } = req.params
            if (otherEntityType === 'all') {
                const toReturn = await entityRelationshipDb.getAllRelatedEntities(entityId, entityType, true)
                return res.send(toReturn)
            } else {
                const toReturn = await entityRelationshipDb.getRelatedEntitiesOfType(entityId, entityType, otherEntityType, true)
                return res.send({
                    entities: toReturn
                })
            }
        } catch (error) {
            res.status(500).send(formatError(error))
        }
    })

    return router
}
