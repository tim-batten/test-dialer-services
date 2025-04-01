import { ScheduleConfigManager } from './managers/schedule-config-manager';

import express from 'express';
import cors from 'cors';
import { makeScheduleRouter } from './routes/schedule';
import { makeCampaignRouter } from './routes/campaign';
import { makeGlobalRouter } from './routes/global';
import { makeConnectRouter } from './routes/connect';
import { makeContactListRouter } from './routes/contact-list';
import { makeFilterRouter } from './routes/filter';
import { makeStatsRouter } from './routes/stats';
import { makeAuthRouter } from './routes/auth';
import { makeServiceStatusRouter } from './routes/service-status';
import { makeQueueStatusRouter } from './routes/queue-status';
import { makeHolidayRouter } from './routes/holiday';
import { makeCampaignGroupRouter } from './routes/campaign-group';
import { makeEntityRelationshipsRouter } from './routes/entity-relationships';
import { serviceConfig } from './config/config';
import { hostWebUi } from './web-ui';

export const makeRestEndpoints = async() => {
  const app = express();
  app.use(
    cors({
      allowedHeaders: ['Content-Type', 'x-cognito-jwt', 'initial-entity-hash'],
      origin: serviceConfig.rest.cors.origin,
      preflightContinue: true,
    })
  );
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });
  app.use(express.json());

  const scheduleRouter = makeScheduleRouter();
  app.use(scheduleRouter);

  const holidayRouter = makeHolidayRouter();
  app.use(holidayRouter);

  const campaignRouter = makeCampaignRouter();
  app.use(campaignRouter);

  const campaignGroupRouter = makeCampaignGroupRouter();
  app.use(campaignGroupRouter);

  const globalRouter = makeGlobalRouter();
  app.use(globalRouter);

  const contactListRouter = makeContactListRouter();
  app.use(contactListRouter);

  const filterRouter = makeFilterRouter();
  app.use(filterRouter);

  const connectRouter = makeConnectRouter();
  app.use(connectRouter);

  const statsRouter = makeStatsRouter();
  app.use(statsRouter);

  const authRouter = makeAuthRouter();
  app.use(authRouter);

  const serviceStatusRouter = makeServiceStatusRouter();
  app.use(serviceStatusRouter);

  const queueStatusRouter = makeQueueStatusRouter();
  app.use(queueStatusRouter);

  const entityRelationshipRouter = makeEntityRelationshipsRouter();
  app.use(entityRelationshipRouter);

  if (serviceConfig.webUi.enabled) {
    await hostWebUi(app);
  }

  return app;
}
