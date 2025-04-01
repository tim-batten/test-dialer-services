import { Router, Request, Response } from 'express';
import hash from 'object-hash';
import { makeAuth } from '../auth/auth';
import { TokenInfo } from '../auth/token-info';
import { ServiceRole } from 'lcme-common/lib/types/roles';
import { GlobalConfigDefinition } from 'lcme-common/lib/models/global-config';
import { ValidationError } from 'class-validator';
import { formatError } from 'lcme-services-common/lib/utils/error-helper';
import { CrudAction, makeEntityResponse } from './config-entity-route-builder';
import { globalConfigManager } from '../globals';
import { Logger } from 'lcme-services-common/lib/logger/logger';
import { serviceConfig } from '../config/config';

export function makeGlobalRouter(): Router {
  const logger = Logger.getLogger();
  const router = Router();
  const routeBase = '/global';

  function makeResponseBody(global: GlobalConfigDefinition, tokenInfo: TokenInfo) {
    const responseBody = makeEntityResponse('global', global.toPlain());
    return responseBody;
  }

  router.post(
    routeBase,
    makeAuth(CrudAction.CREATE, ServiceRole.ADMINISTRATOR),
    async (req: Request, res: Response) => {
      const tokenInfo = res.locals.tokenInfo as TokenInfo;
      try {
        let globalDefinition;
        try {
          globalDefinition = GlobalConfigDefinition.from(req.body);
        } catch (e) {
          const validationError = e as ValidationError;
          logger.log('info', validationError.toString());
          return res.status(400).send(formatError(e));
        }
        const entity = await globalConfigManager.get();
        if (entity) {
          if (!serviceConfig.dev.isSkipUpdateConflictChecksOn('global')) {
            const currentEntityHash = hash(JSON.stringify({ ...entity.toPlain() }));
            const hasStateChanged = currentEntityHash !== req.headers['initial-entity-hash'];
            if (hasStateChanged) {
              return res.status(409).send(new Error(`409 Conflict Error`));
            }
          }
        }

        await globalConfigManager.set(globalDefinition);
        res.send(makeResponseBody(globalDefinition, tokenInfo));
      } catch (e) {
        let errorMessage = 'Unknown';
        logger.log('info', e);
        if (e instanceof Error) {
          errorMessage = e.message;
        }
        res.status(400).send(errorMessage);
      }
    }
  );

  router.get(
    routeBase,
    makeAuth(
      CrudAction.READ,
      ServiceRole.ADMINISTRATOR,
      ServiceRole.ANALYST,
      ServiceRole.DEVELOPER,
      ServiceRole.READ_ONLY
    ),
    async (req: any, res: Response) => {
      const tokenInfo = res.locals.tokenInfo as TokenInfo;
      try {
        const entity = await globalConfigManager.get();
        if (!entity) {
          return res.status(404).send(`Entity not found`);
        }
        res.send(makeResponseBody(entity, tokenInfo));
      } catch (e) {
        res.status(500).send(formatError(e));
      }
    }
  );

  router.get(
    `${routeBase}/dialerdefaults`,
    makeAuth(
      CrudAction.READ,
      ServiceRole.ADMINISTRATOR,
      ServiceRole.ANALYST,
      ServiceRole.DEVELOPER,
      ServiceRole.READ_ONLY
    ),
    async (req: any, res: Response) => {
      try {
        const entity = await globalConfigManager.get();
        if (!entity) {
          return res.status(404).send(`Entity not found`);
        }
        res.send(entity.DialerDefaults.toPlain());
      } catch (e) {
        res.status(500).send(formatError(e));
      }
    }
  );

  return router;
}
