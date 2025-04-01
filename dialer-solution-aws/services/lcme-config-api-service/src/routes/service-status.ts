import { Router, Response } from 'express';
import { formatError } from 'lcme-services-common/lib/utils/error-helper';
import { defaultValidReadRoles } from '../managers/generic-entity-manager';
import { makeAuth } from '../auth/auth';
import { CrudAction } from './config-entity-route-builder';
import { serviceTypes } from 'lcme-services-common/lib/db/service-info-db';
import { ApiStatus } from 'lcme-common/lib/types/api-status';
import { ServiceManager } from 'lcme-services-common/lib/utils/service-manager';
import { Logger } from 'lcme-services-common/lib/logger/logger';
import { serviceConfig } from '../config/config';

export function makeServiceStatusRouter(): Router {
  const router = Router();

  const logger = Logger.getLogger();
  const serviceManager = ServiceManager.getInstance();
  const serviceInfoDb = serviceManager.serviceInfoDb;
  const jobManagerDb = serviceManager.jobManager.jobDb;

  router.get('/servicestatus', makeAuth(CrudAction.READ, ...defaultValidReadRoles), async (req: any, res: Response) => {
    try {
      const allServices = await ServiceManager.getAllServicesWithJobs(serviceInfoDb, jobManagerDb, serviceTypes);
      res.send({
        ...allServices,
      });
    } catch (error) {
      logger.log('info', error);
      res.status(500).send(formatError(error));
    }
  });

  router.get(
    '/jobtoworker/:jobId',
    makeAuth(CrudAction.READ, ...defaultValidReadRoles),
    async (req: any, res: Response) => {
      const jobId = req.params.jobId;
      if (!jobId) {
        return res.status(400).send(formatError('Must supply job ID'));
      }
      try {
        const workerId = await jobManagerDb.getWorkerForJob(jobId);
        res.send({
          workerId,
        });
      } catch (error) {
        logger.log('info', error);
        res.status(500).send(formatError(error));
      }
    }
  );

  router.get(
    '/workertojobs/:workerid',
    makeAuth(CrudAction.READ, ...defaultValidReadRoles),
    async (req: any, res: Response) => {
      const workerId = req.params.workerid;
      if (!workerId) {
        return res.status(400).send(formatError('Must supply worker ID'));
      }
      try {
        const jobIds = await jobManagerDb.getAllJobsForWorker(workerId);
        res.send({
          jobIds,
        });
      } catch (error) {
        logger.log('info', error);
        res.status(500).send(formatError(error));
      }
    }
  );

  router.get('/status', (req, res) => {
    const toReturn: ApiStatus = {
        status: 'ok',
        version: process.env.npm_package_version || 'unknown',
        variant: 'amazon-connect',
        serviceName: serviceConfig.db.namespace,
    };
    return res.send(toReturn);
  });

  return router;
}
