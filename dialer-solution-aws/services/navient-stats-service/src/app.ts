import express from "express"
import { makeContactEventRouter } from "./routes/contact-event";
import { Logger } from 'navient-services-common/lib/logger/logger';
import { ContactEventHandler } from './handlers/contact-event-handler';

// CONNECT_TODO: Remove event streams and call status routers and replace with Contact Event handlers
export function makeRestEndpoints(contactEventHandler: ContactEventHandler) {
    const logger = Logger.getLogger();
    const app = express()
    app.use(express.json())
    app.on('error', (err) => {
        logger.mlog('error', ['Error in express app', err]);
    });

    const contactEventRouter = makeContactEventRouter(contactEventHandler);
    app.use(contactEventRouter);
    
    return app 
}