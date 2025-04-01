import { plainToClass } from "class-transformer"
import express, { Router } from "express"
import { Logger } from "navient-services-common/lib/logger/logger"
import { CacheManager } from "../cache-manager"
import { CacheBuildPostback } from "../models/cache-build"

export const POSTBACK_PATH = 'cachebuildresult'

export function makeCachePostbackRouter(cacheManager: CacheManager): Router {
    const logger = Logger.getLogger()
    const router = Router()

    router.get(`/${POSTBACK_PATH}`, async(req, res) => {

        res.status(200).send('success');

    });

    router.post(`/${POSTBACK_PATH}`, async(req, res) => {
        logger.log('info', 'Received cache postback request (POST)')
        logger.mlog('debug', ['Cache postback headers: ', req.headers])
        try {
            let responses = req.body
            if (typeof req.body === 'string') {
                responses = JSON.parse(req.body) as any[]
            }
            for (const postbackResponse of responses) {
                const cacheBuildPostback = plainToClass(CacheBuildPostback, postbackResponse)
                const result = cacheManager.cacheBuildPostbackReceived(cacheBuildPostback)
                if (!result) {
                    res.status(404)
                }
            }
            res.send()
        } catch (e) {
            logger.log('info', e)
            res.status(400)
            res.send()
        }

    })

    return router
}