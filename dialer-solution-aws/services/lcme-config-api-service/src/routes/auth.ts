import { Router, Request, Response } from 'express'
import { defaultValidReadRoles } from "../managers/generic-entity-manager"
import { makeAuth } from "../auth/auth"
import { CrudAction } from "./config-entity-route-builder"
import { TokenInfo } from '../auth/token-info'
import { serviceConfig } from '../config/config'
import { RolesApiResponse } from 'lcme-common/lib/types/roles'

export function makeAuthRouter() {
    const router = Router()

    router.get('/auth/roles', makeAuth(CrudAction.READ, ...defaultValidReadRoles), async(req: Request, res: Response) => {
        const tokenInfo = res.locals.tokenInfo as TokenInfo
        const response: RolesApiResponse = {
            roles: tokenInfo.dlr_role,
            authEnabled: serviceConfig.dev.skipAuthCheck ? false : true,
        }
        return res.send({
            roles: tokenInfo.dlr_role,
            authEnabled: serviceConfig.dev.skipAuthCheck ? false : true,
        })
    })

    return router
}