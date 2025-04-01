import { FilterDefinition } from 'lcme-common/lib/models/filter';
import { Router, Response } from 'express';
import { CrudAction, makeConfigRouter } from './config-entity-route-builder';
import { formatError } from 'lcme-services-common/lib/utils/error-helper';
import {
  campaignConfigDb,
  contactListConfigDb,
  filterConfigDb,
  filterConfigManager,
  redisClientPool,
} from '../globals';
import { RequestClient } from 'lcme-services-common/lib/requests/request-client';
import { serviceConfig } from '../config/config';
import { ValidateFilterRequest } from '../managers/filter-config-manager';
import {
  FilterValidationResponseData,
  IncomingFilterValidationRequest,
  SequenceFilterValidationRequest,
  generateDummyFilterValidationResponse,
  generateSequenceFilterValidationRequest,
} from '../models/multi-filter-validation';
import { transformAndValidate } from 'class-transformer-validator';
import { ValidationError } from 'class-validator';
import { Logger } from 'lcme-services-common/lib/logger/logger';
import { getDateFromHHMMString, localIANAZone } from 'lcme-common/lib/utils/date-helper';
import { makeAuth } from '../auth/auth';
import { ALL_SERVICE_ROLES } from 'lcme-common/lib/types/roles';
import { RequestLocker } from '../utils/request-locker';
import { ServiceManager } from 'lcme-services-common/lib/utils/service-manager';

const logger = Logger.getLogger();
type FilterValidationLockType = 'user' | 'contactList';
type FilterValidationResponseBody = {
  results: FilterValidationResponseData;
  request?: SequenceFilterValidationRequest;
};

export function makeFilterRouter(): Router {
  const router = makeConfigRouter(filterConfigManager, FilterDefinition.from, 'filter', 'filters');
  const lcmeCrudClient = new RequestClient(serviceConfig.crudApi.crudApiUrl);

  router.get('/filters', async (req: any, res: Response) => {
    try {
      const { isPhone, isFilter } = req.query;
      const entities = await filterConfigManager.getAll();
      const sortedEntities = entities.filter((entity: FilterDefinition) => {
        const doesMatchFilterParam = (entity.filterOrSort === 'filter') === (isFilter === 'true');
        const doesMatchPhoneParam = (entity.filterType === 'phone') === (isPhone === 'true');

        return doesMatchFilterParam && doesMatchPhoneParam;
      });
      const plainEntities = sortedEntities.map((entity: any) => entity.toPlain());
      return res.send(plainEntities);
    } catch (e) {
      return res.status(500).send(formatError(e));
    }
  });

  router.post('/filters/validate', async (req: any, res: Response) => {
    const filter = req.body;
    try {
      const validateFilterRequest = new ValidateFilterRequest(
        filter.tableCL,
        filter.filterSQL,
        filter.filterType,
        filter.filterName,
        filter.filterOrSort
      );
      const headers = {
        'Content-Type': 'application/json-patch+json',
        accept: 'text/plain',
      };
      const https = serviceConfig.apiCertificate.getHttpsOptions();
      const { body }: any = await lcmeCrudClient.post(validateFilterRequest, headers, https);
      return res.status(200).send(body);
    } catch (e) {
      return res.status(500).send(formatError(e));
    }
  });
  const requestLocker = new RequestLocker<FilterValidationLockType>(
    redisClientPool,
    ServiceManager.getInstance().serviceInfo.id,
    'filter-validation-lock'
  );
  router.post(
    '/filters/validate/multi-filter',
    makeAuth(CrudAction.READ, ...ALL_SERVICE_ROLES),
    async (req: any, res: Response) => {
      let okLockResult: Awaited<ReturnType<typeof requestLocker.createLocks>>['ok'] | undefined = undefined;
      let multiFilterReq: IncomingFilterValidationRequest;
      try {
        multiFilterReq = (await transformAndValidate(
          IncomingFilterValidationRequest,
          req.body
        )) as IncomingFilterValidationRequest;
      } catch (e) {
        const validationError = e as ValidationError;
        logger.log('info', validationError.toString());
        return res.status(400).send(formatError(e));
      }
      const { campaignId, phones, filterIds, startTime, endTime, timezone } = multiFilterReq;
      const campaign = await campaignConfigDb.get(campaignId);
      if (!campaign) {
        return res.status(404).send(formatError(`Campaign with id ${campaignId}`));
      }
      const reqUserId = multiFilterReq.userIdOverride || res.locals.tokenInfo.userId;
      const reqUserName = res.locals.tokenInfo.userName;
      const toLock: Parameters<typeof requestLocker.createLocks>[0] = [];
      if (serviceConfig.filterValidation.userConcurrency.enabled) {
        toLock.push({
          concurrencyLockType: 'user',
          ttl: serviceConfig.filterValidation.userConcurrency.ttl,
          entityId: reqUserId,
        });
      }
      if (serviceConfig.filterValidation.contactListConcurrency.enabled) {
        toLock.push({
          concurrencyLockType: 'contactList',
          ttl: serviceConfig.filterValidation.contactListConcurrency.ttl,
          entityId: campaign.BaseConfig.ContactListConfigID,
          data: {
            userId: reqUserId,
            userName: reqUserName,
          },
        });
      }
      const lockResult = await requestLocker.createLocks(toLock);
      if (lockResult.failed) {
        let message = `Could not get filter validation locks`;
        if (lockResult.failed.user) {
          message += `. User already has a filter validation request in progress`;
        }
        if (lockResult.failed.contactList) {
          message += `. Contact list already has a filter validation request in progress by user ${lockResult.failed.contactList.value?.data?.userName}`;
        }
        return res.status(409).send({
          message,
          locks: lockResult.failed,
        });
      }
      okLockResult = lockResult.ok;
      if (!okLockResult) {
        return res.status(500).send(formatError('Could not get filter validation locks'));
      }
      try {
        const [contactList, filters] = await Promise.all([
          contactListConfigDb.get(campaign.BaseConfig.ContactListConfigID),
          filterConfigDb.mgetList(filterIds),
        ]);
        if (!contactList) {
          return res.status(404).send(formatError(`Contact list with id ${campaign.BaseConfig.ContactListConfigID}`));
        }
        if (filters.length !== filterIds.length) {
          return res
            .status(404)
            .send(
              formatError(
                `Could not find the following filter IDs: ${filterIds.filter(
                  (id) => !filters.find((filter) => filter.id === id)
                )}`
              )
            );
        }
        const startDate = getDateFromHHMMString(startTime, timezone || localIANAZone);
        const endDate = getDateFromHHMMString(endTime, timezone || localIANAZone);
        const request = generateSequenceFilterValidationRequest(
          serviceConfig.filterValidation.appNameId,
          campaign,
          contactList,
          phones,
          filters,
          startDate,
          endDate,
          serviceConfig.dev.simulatedFilterValidationDelay
        );
        if (serviceConfig.dev.skiplcmeCrud) {
          const response: FilterValidationResponseBody = {
            results: generateDummyFilterValidationResponse(phones),
            request,
          };
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              res.status(200).send(response);
              resolve();
            }, serviceConfig.dev.simulatedFilterValidationDelay || 0);
          });
        } else {
          const apiResponse = await filterConfigManager.validateMultiFilter(request);
          const singleResponse = Array.isArray(apiResponse) ? apiResponse[0] : apiResponse;
          if (!singleResponse || !singleResponse.data || singleResponse.isSuccess === false) {
            logger.log('warn', `Filter validation response error ${JSON.stringify(apiResponse)} for request ${JSON.stringify(request)}`);
            return res.status(500).send({
              message: singleResponse.statusMessage || 'Unknown error',
              data: singleResponse.data,
            });
          }
          const response: FilterValidationResponseBody = {
            results: singleResponse.data,
          };
          res.status(200).send(response);
        }
      } catch (e) {
        return res.status(500).send(formatError(e));
      } finally {
        if (okLockResult) {
          requestLocker.unlockLocks(...Object.values(okLockResult));
        }
      }
    }
  );

  return router;
}
