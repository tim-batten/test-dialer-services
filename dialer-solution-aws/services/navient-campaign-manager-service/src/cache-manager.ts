import { classToPlain, plainToClass } from 'class-transformer';
import { CampaignExecutionDefinition } from 'navient-common/lib/models/campaign-execution';
import { CampaignManager } from './campaign-manager';
import { CacheBuildRequest, CacheBuildPostback, CacheBuildResponse } from './models/cache-build';
import { serviceConfig } from './config/config';
import { CacheReleaseRequest, CacheReleaseResponse } from './models/cache-release';
import { POSTBACK_PATH } from './routes/cache-postback';
import { RequestClient } from 'navient-services-common/lib/requests/request-client';
import { Logger } from 'navient-services-common/lib/logger/logger';

export class CacheManager {
  protected readonly logger: Logger = Logger.getLogger();
  campaignManager: CampaignManager;
  cacheApiUrl: string;
  cacheReleaseUrl: string;
  cachePostbackUrl: string;
  cacheEventActions: { [cacheEventActionsId: number]: CampaignExecutionDefinition } = {};
  cacheBuildClient: RequestClient;
  cacheReleaseClient: RequestClient;

  constructor(campaignManager: CampaignManager) {
    this.campaignManager = campaignManager;
    this.cacheApiUrl = serviceConfig.cacheApi.cacheApiUrl;
    this.cacheReleaseUrl = serviceConfig.cacheApi.cacheReleaseUrl;
    this.cachePostbackUrl = `${serviceConfig.rest.getPublicAddress(serviceConfig.server.hostname)}/${POSTBACK_PATH}`;
    this.cacheBuildClient = new RequestClient(this.cacheApiUrl);
    this.cacheReleaseClient = new RequestClient(this.cacheReleaseUrl);
  }

  public async buildCache(campaignExecutionInfo: CampaignExecutionDefinition) {
    const cacheBuildRequest = new CacheBuildRequest(campaignExecutionInfo, this.cachePostbackUrl);
    this.logger.log('info', `Sending cache build request`, { entity: campaignExecutionInfo });
    this.logger.mlog('info', ['Cache build request body:', cacheBuildRequest], { entity: campaignExecutionInfo });
    if (serviceConfig.dev.skipCacheSend) {
      this.logger.log('info', `Skipping cache build request`, { entity: campaignExecutionInfo });
      setTimeout(() => {
        const cacheEventActionsId = Math.floor(Math.random() * 100000);
        this.cacheEventActions[cacheEventActionsId] = campaignExecutionInfo;
        this.campaignManager.campaignExecutionDb.setCacheEventActionsId(campaignExecutionInfo, cacheEventActionsId);
        this.cacheBuildPostbackReceived({
          isSuccess: true,
          statusMessage: '',
          data: {
            cache_eventActions_ID: cacheEventActionsId,
            cachedRecords: serviceConfig.dev.cachedRecords,
            timeWindow_callableRecords: serviceConfig.dev.cachedRecords,
            isSuccessful: true,
          },
        });
      }, serviceConfig.dev.cacheResponseDelay);
      return;
    }
    try {
      const json = classToPlain(cacheBuildRequest);
      const headers = {
        'Content-Type': 'application/json-patch+json',
        accept: 'text/plain',
      };
      const https = serviceConfig.apiCertificate.getHttpsOptions();
      const response = await this.cacheBuildClient.post(json, headers, https);
      if (!response || !response.body) {
        this.logger.log('info', `Cache build failed: No respose or empty response body`, {
          entity: campaignExecutionInfo,
        });
        this.campaignManager.campaignExecutionFailed(
          campaignExecutionInfo,
          `Cache build failed with reason: No respose or empty response body`
        );
        return;
      }
      this.logger.log(
        'info',
        `Got cache build response ${response ? `${response.statusCode} ${response.statusMessage}` : undefined}`,
        { entity: campaignExecutionInfo }
      );
      this.logger.mlog('verbose', ['Cache build response body:', response.body], { entity: campaignExecutionInfo });
      if (!response.body || !Array.isArray(response.body) || response.body.length === 0) {
        this.logger.log('info', `Cache build failed: Empty response body`, { entity: campaignExecutionInfo });
        this.campaignManager.campaignExecutionFailed(
          campaignExecutionInfo,
          `Cache build failed with reason: Empty response body`
        );
        return;
      }
      for (const responseBody of response.body) {
        const cacheBuildResponse = plainToClass(CacheBuildResponse, responseBody);
        if (!cacheBuildResponse.isSuccess) {
          this.logger.log('info', `Cache build failed: ${cacheBuildResponse.statusMessage}`, {
            entity: campaignExecutionInfo,
          });
          this.campaignManager.campaignExecutionFailed(
            campaignExecutionInfo,
            `Cache build failed with reason: ${cacheBuildResponse.statusMessage}`
          );
          continue;
        }
        cacheBuildResponse.data.returnData.forEach((returnData) => {
          const cacheEventActionsID = returnData.cache_eventActions_ID;
          this.logger.log(
            'info',
            `Cache build success for campaign execution ${campaignExecutionInfo.id} with event actions ID of ${cacheEventActionsID}}`,
            { entity: campaignExecutionInfo }
          );

          campaignExecutionInfo.cacheEventActionsId = cacheEventActionsID;
          this.cacheEventActions[cacheEventActionsID] = campaignExecutionInfo;
          this.campaignManager.campaignExecutionDb.setCacheEventActionsId(campaignExecutionInfo, cacheEventActionsID);
          setTimeout(async () => {
            const validatedCampaignExec = await this.campaignManager.campaignExecutionDb.get(campaignExecutionInfo.id);
            if (validatedCampaignExec && !validatedCampaignExec.hasReceivedPostback) {
              this.logger.log('error', `Postback never received: ${campaignExecutionInfo.id}`, {
                entity: campaignExecutionInfo,
              });
              this.campaignManager.campaignExecutionFailed(validatedCampaignExec, 'Postback never received');
            }
          }, serviceConfig.postbackWaitWindow);
        });
      }
    } catch (e: any) {
      this.logger.log('warn', ['Got exception sending cache build request', e], { entity: campaignExecutionInfo });
      this.campaignManager.campaignExecutionFailed(
        campaignExecutionInfo,
        `Cache build failed with reason: ${e.message ? e.message : 'unknown'}`
      );
      return;
    }
  }

  public async cacheBuildPostbackReceived(cacheBuildPostback: CacheBuildPostback, retryAttempts?: number) {
    const cacheEventActionsId = cacheBuildPostback.data.cache_eventActions_ID;
    this.logger.mlog('http', [
      'Got cache postback:',
      cacheBuildPostback,
      retryAttempts ? `Retry attempt ${retryAttempts}` : '',
    ]);
    let campaignExecution;

    campaignExecution = this.cacheEventActions[cacheEventActionsId];
    if (campaignExecution) {
      this.logger.log(
        'info',
        `campaignExecution ${campaignExecution.id} fetched from memory for cacheEventActionsId ${cacheEventActionsId}`,
        { entity: campaignExecution }
      );
    } else {
      campaignExecution = await this.campaignManager.campaignExecutionDb.getCampaignExecutionFromCacheEventActionsId(
        cacheEventActionsId
      );
      this.logger.log(
        'info',
        `campaignExecution ${
          campaignExecution ? campaignExecution.id : 'unable to be'
        } fetched from redis for cacheEventActionsId ${cacheEventActionsId}`,
        { entity: campaignExecution }
      );
    }
    delete this.cacheEventActions[cacheEventActionsId];

    if (campaignExecution) {
      this.campaignManager.campaignExecutionDb.removeEventActionsIdFromMap(cacheEventActionsId);
      await this.campaignManager.campaignExecutionDb.jsonUpdate(campaignExecution.id, '.hasReceivedPostback', 'true');
    } else {
      this.logger.log(
        'info',
        `campaign execution id for ${cacheBuildPostback.data.cache_eventActions_ID} not found, retrying`,
        { entity: campaignExecution }
      );
      if (!retryAttempts) {
        retryAttempts = 1;
      } else {
        retryAttempts++;
      }
      if (retryAttempts > 3) {
        return false;
      }
      this.cacheBuildPostbackReceived(cacheBuildPostback, retryAttempts);
      this.logger.log(
        'info',
        `campaign execution id for ${cacheBuildPostback.data.cache_eventActions_ID} not found, exiting`,
        { entity: campaignExecution }
      );
      return false;
    }
    await this.campaignManager.campaignExecutionDb.setPostbackReceived(campaignExecution, cacheEventActionsId);

    if (!cacheBuildPostback.data.isSuccessful) {
      this.campaignManager.campaignExecutionFailed(
        campaignExecution,
        `Cache build failed, postback isSuccessful=false, reason: ${cacheBuildPostback.statusMessage}`
      );
      return true;
    }
    if (cacheBuildPostback.data.cachedRecords === 0) {
      this.logger.log('info', 'Cache build postback indicated no records were cached; campaign finished', {
        entity: campaignExecution,
      });
      this.campaignManager.campaignExecutionComplete(campaignExecution);
      this.campaignManager.campaignExecutionIdFinalised(campaignExecution.id);
      return true;
    }
    this.buildCacheComplete(cacheBuildPostback, campaignExecution);
    return true;
  }

  public buildCacheComplete(
    cacheBuildResponse: CacheBuildPostback,
    campaignExecutionInfo: CampaignExecutionDefinition
  ) {
    this.logger.log('info', 'Received cache build postback', { entity: campaignExecutionInfo });
    this.logger.mlog('verbose', ['Cache build postback response: ', cacheBuildResponse], {
      entity: campaignExecutionInfo,
    });
    this.campaignManager.readyToQueue(cacheBuildResponse, campaignExecutionInfo);
  }

  public async releaseCache(campaignExecutionInfo: CampaignExecutionDefinition) {
    if (!campaignExecutionInfo.cacheEventActionsId) {
      this.logger.log(
        'verbose',
        `Not releasing cache for campaign execution ${campaignExecutionInfo.id} as no cache_eventActions_ID is set`,
        { entity: campaignExecutionInfo }
      );
      return false;
    }
    if (serviceConfig.dev.skipCacheSend) {
      this.logger.log('info', 'Releasing cache', { entity: campaignExecutionInfo });
      return true;
    }
    const cacheReleaseRequest = new CacheReleaseRequest(
      serviceConfig.cacheReleaseAppNameId,
      campaignExecutionInfo.cacheEventActionsId
    );
    this.logger.log('info', 'Sending cache release request', { entity: campaignExecutionInfo });
    this.logger.mlog('verbose', ['Cache release request body: ', cacheReleaseRequest], {
      entity: campaignExecutionInfo,
    });
    let response;
    try {
      const json = classToPlain(cacheReleaseRequest);
      const headers = {
        'Content-Type': 'application/json-patch+json',
        Accept: 'text/plain',
      };
      const https = serviceConfig.apiCertificate.getHttpsOptions();
      response = await this.cacheReleaseClient.post(json, headers, https);
    } catch (e: any) {
      this.logger.log('info', `Cache release failed: ${e.message}`, { entity: campaignExecutionInfo });
      return false;
    }
    const responseBodyArray = response.body as any[];
    for (const responseBody of responseBodyArray) {
      const cacheReleaseResponse = plainToClass(CacheReleaseResponse, responseBody);
      if (cacheReleaseResponse) {
        if (cacheReleaseResponse.isSuccess && cacheReleaseResponse.data && cacheReleaseResponse.data.returnData) {
          cacheReleaseResponse.data.returnData.forEach((result) => {
            this.logger.log(
              'info',
              `Released ${result.totalReleased} records for cache_eventActions_ID ${campaignExecutionInfo.cacheEventActionsId}`,
              { entity: campaignExecutionInfo }
            );
          });
        } else {
          this.logger.log('info', `Cache release failed with status message ${cacheReleaseResponse.statusMessage}`, {
            entity: campaignExecutionInfo,
          });
        }
      }
    }
    return true;
  }
}
