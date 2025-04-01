import express from "express"
import { CacheManager } from "./cache-manager"
import { makeCachePostbackRouter } from "./routes/cache-postback"

export function makeRestEndpoints(cacheManager: CacheManager) {
    const app = express()
    app.use(express.json({strict: false}))

    const cachePostbackRouter = makeCachePostbackRouter(cacheManager)
    app.use(cachePostbackRouter)

    return app 
}