import { Router, Response } from "express"
import { redisClientPool } from "../globals"
import { QueueDb } from "navient-services-common/lib/db/queue-db"
import { makeAuth } from "../auth/auth"
import { defaultValidReadRoles } from "../managers/generic-entity-manager"
import { CrudAction } from "./config-entity-route-builder"

export function makeQueueStatusRouter(): Router {
    const router = Router()

    const queueDb = new QueueDb(redisClientPool)
    
    router.get('/listwork', makeAuth(CrudAction.READ, ...defaultValidReadRoles), async(req: any, res: Response) => {
        const workItems = await queueDb.getAllWork()
        return res.send({
            workItemCount: workItems.length,
            workItems
        })
    })

    router.get('/listqueuedrecords/:campaignExecutionId', makeAuth(CrudAction.READ, ...defaultValidReadRoles), async(req: any, res: Response) => {
        const id = req.params.campaignExecutionId
        const queuedRecords = await queueDb.getAllRecords(id)
        return res.send({
            queuedRecordCount: queuedRecords.length,
            queuedRecords
        })
    })
    return router
}