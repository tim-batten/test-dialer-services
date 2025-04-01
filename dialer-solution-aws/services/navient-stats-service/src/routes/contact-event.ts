import { Router } from 'express';
import { Logger } from 'navient-services-common/lib/logger/logger';
import { ContactEventHandler } from '../handlers/contact-event-handler';
import { transformContactEvent } from 'navient-services-common/lib/types/amazon-connect/contact-event';

export function makeContactEventRouter(contactEventHandler: ContactEventHandler): Router {
  const logger = Logger.getLogger();
  const router = Router();

  router.get('/contact-events', async (req, res) => {
    console.log('GET contact-events');
    res.status(200).send('success');
  });

  router.post('/contact-events', async (req, res) => {
    try {
      const contactEventPlain = req.body;
      if (logger.isLoggable('silly')) {
        logger.log('silly', `Received event: ${JSON.stringify(contactEventPlain, null, 2)}`);
      }
      const transformed = await transformContactEvent(contactEventPlain);
      contactEventHandler.handleEvent(transformed.detail);
      res.sendStatus(200);
    } catch (err) {
      logger.mlog('error', ['Error in contact event router', err]);
      res.sendStatus(200);
    }
  });

  return router;
}
