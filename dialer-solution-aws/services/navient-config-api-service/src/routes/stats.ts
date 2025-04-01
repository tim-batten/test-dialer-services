import { Router, Request, Response } from 'express'
import { makeAuth } from "../auth/auth"
import { CampaignStatsRetriever } from "../managers/campaign-stats-retriever"
import { formatError } from 'navient-services-common/lib/utils/error-helper'
import { CrudAction } from './config-entity-route-builder'
import { defaultValidReadRoles } from '../managers/generic-entity-manager'
import { campaignStatsRetriever } from '../globals'

export function makeStatsRouter(): Router {
    const router = Router()

    router.get('/stats/schedule-execution/:schedule_execution', makeAuth(CrudAction.READ, ...defaultValidReadRoles), async(req: any, res: Response) => {
        try {
            const scheduleExecutionId = req.params.schedule_execution as string
            if (scheduleExecutionId === 'all') {
                const oversightStats = await campaignStatsRetriever.getAllOversightStats()
                res.status(200).send(oversightStats)
            } else {
                const oversightStats = await campaignStatsRetriever.getOversightStats(scheduleExecutionId)
                res.status(200).send(oversightStats)
            }
        } catch (error) {
            res.status(500).send(formatError(error))
        }
    })

    return router
}
