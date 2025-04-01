import _, { isBoolean, merge } from 'lodash'
import { Router, Request, Response } from 'express'

import { makeAuth } from '../auth/auth'
import { TokenInfo } from '../auth/token-info'
import { ServiceRole } from 'lcme-common/lib/types/roles';
import { DbEntity, Transformable } from 'lcme-common/lib/models/db-entity';
import { EntityManager } from '../managers/entity-manager';
import { validateOrReject, ValidatorOptions, ValidationError } from 'class-validator'
import { defaultCRUDValidatorOptions } from 'lcme-common/lib/utils/validation'
import { caseInsensitiveGetValue } from 'lcme-services-common/lib/utils/object-helper'
import { formatError } from 'lcme-services-common/lib/utils/error-helper'
import { Logger } from 'lcme-services-common/lib/logger/logger';
import { redisClientPool } from '../globals'
import hash from 'object-hash'
import { serviceConfig } from '../config/config';

export enum CrudAction {
    CREATE = 'Create',
    READ = 'Read',
    UPDATE = 'Update',
    DELETE = 'Delete'
}

export function makeMissingRoleError(crudAction: CrudAction, tokenInfo: TokenInfo, allowedRoles: ServiceRole[]) {
    return {
        error: `User does not have required role to perform action: ${crudAction}`,
        allowedRoles,
        userRoles: tokenInfo.dlr_role,
    }
}

export function makeEntityResponse(entityType: string, entity: any) {
    const toReturn: { [key: string]: any } = {}
    toReturn[entityType] = entity
    return toReturn
}

export function sendErrorResponse(res: Response, e: any, defaultStatusCode: number = 400) {
    const status = (e.status && _.isInteger(e.status)) ? e.status : defaultStatusCode
    res.status(status)
    const errorBody = formatError(e)
    return res.send(errorBody)
}

export function makeConfigRouter<T extends DbEntity & Transformable>(entityManager: EntityManager<T>, entityBuilder: (entityObj: any, validatorOptions?: ValidatorOptions) => T, entityTypeSingular: string, entityTypePlural: string): Router {
    const logger = Logger.getLogger()
    const router = Router()
    const routeBase = '/' + entityTypePlural

    router.post(routeBase, makeAuth(CrudAction.CREATE, ...entityManager.validCreateRoles), async (req: Request, res: Response) => {
        const tokenInfo = res.locals.tokenInfo as TokenInfo
        if (!tokenInfo.hasRole(...entityManager.validCreateRoles)) {
            return res.status(403).send(makeMissingRoleError(CrudAction.CREATE, tokenInfo, entityManager.validCreateRoles))
        }

        try {
            let entityDefinition
            try {
                entityDefinition = entityBuilder(req.body, { validationError: { target: false } })
            } catch (e) {
                const validationError = e as ValidationError
                logger.log('info', validationError.toString())
                return res.status(400).send(formatError(e))
            }
            const toReturn = await entityManager.add(entityDefinition)
            res.send(makeEntityResponse(entityTypeSingular, toReturn.toPlain()))
        } catch (e) {
            logger.log('info', e)
            return sendErrorResponse(res, e, 400)
        }
    })

    router.patch(routeBase + '/:id', makeAuth(CrudAction.UPDATE, ...entityManager.validUpdateRoles), async (req: Request, res: Response) => {
        try {
            entityManager.namespaceValidityCheck(req.params.id)
            const lockKey = `${redisClientPool.makeBaseRedisKey('lock')}:${req.params.id}`

            const currentEntity = await entityManager.get(req.params.id)
            if (!currentEntity) {
                return res.status(404).send(`Entity with id ${req.params.id} not found`)
            }
            // Merge but replace arrays
            const unpatchedCurrentEntity = { ...currentEntity.toPlain() }
            const mergedPlain = _.mergeWith({}, currentEntity, req.body, (a, b) =>
                _.isArray(b) ? b : undefined
            );
            const currentEntityHash = hash(JSON.stringify(unpatchedCurrentEntity))
            if (!serviceConfig.dev.isSkipUpdateConflictChecksOn(entityTypeSingular)) {
                const hasStateChanged = currentEntityHash !== req.headers['initial-entity-hash']
                if (hasStateChanged) {
                    return res.status(409).send(new Error(`409 Conflict Error`))
                }
            }
            const merged = entityBuilder(mergedPlain, { validationError: { target: false } })
            await validateOrReject(merged, { ...defaultCRUDValidatorOptions, ...{ validationError: { target: false } } })
            await redisClientPool.redlock.using([lockKey], 3000, async (signal) => {
                await entityManager.update(merged)
                if (signal.aborted) {
                    throw signal.error
                }
            })
            res.send(makeEntityResponse(entityTypeSingular, merged.toPlain()))
        } catch (e) {
            logger.log('info', e)
            return sendErrorResponse(res, e, 400)
        }
    })

    router.delete(routeBase + '/:id', makeAuth(CrudAction.DELETE, ...entityManager.validDeleteRoles), async (req: Request, res: Response) => {
        try {
            const id = req.params.id
            entityManager.namespaceValidityCheck(id)
            const skipDeletion = caseInsensitiveGetValue(req.query, 'skipdeletion') === 'true' ? true : false
            if (!id) {
                return res.status(400).send(`Bad request - param 'id' not supplied`)
            } else if (id === 'all') {
                //await entityManager.removeAll()
                return res.status(400).send('Cannot remove all')
            } else {
                const currentEntity = await entityManager.get(id)
                if (!currentEntity) {
                    return res.status(404).send(`Not found - entity with 'id' ${id} not found`)
                }
                const dependents = await entityManager.getDependents(currentEntity)
                const cascade = req.query.cascade
                if (cascade) {
                    if (dependents && !dependents.cascadeDeletable) {
                        return res.status(409).send({ dependents })
                    }
                    if (skipDeletion) {
                        return res.status(200).send({ message: 'Entity not deleted - skipdeletion flag set' })
                    }
                    await entityManager.cascadeRemove(currentEntity)
                } else {
                    if (dependents) {
                        return res.status(409).send({
                            dependents
                        })
                    }
                    if (skipDeletion) {
                        return res.status(200).send({ message: 'Entity not deleted - skipdeletion flag set' })
                    }
                    await entityManager.remove(currentEntity)
                }
            }
            res.status(200).send()
        } catch (e: any) {
            logger.log('error', e)
            return sendErrorResponse(res, e, 400)
        }
    })

    router.get(routeBase + '/:id', makeAuth(CrudAction.READ, ...entityManager.validReadRoles), async (req: Request, res: Response) => {
        try {
            if (req.params.id === 'all') {
                const allEntities = await entityManager.getAll()
                if (!allEntities) {
                    return res.send([])
                }
                const toReturn = allEntities.map((entity: any) => entity.toPlain ? entity.toPlain() : entity)
                return res.send(makeEntityResponse(entityTypePlural, toReturn))
            }
            const entity = await entityManager.get(req.params.id)
            if (!entity) {
                return res.status(404).send(`Entity with id ${req.params.id} not found`)
            }
            res.send(makeEntityResponse(entityTypeSingular, entity.toPlain ? entity.toPlain() : entity))
        } catch (error) {
            return sendErrorResponse(res, error, 500)
        }
    })

    return router
}