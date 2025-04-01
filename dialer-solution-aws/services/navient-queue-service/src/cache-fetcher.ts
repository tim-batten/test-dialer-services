import { classToPlain, plainToClass } from "class-transformer"
import crypto from 'crypto'
import { CacheFetchRequest, CacheFetchResponseData } from "./models/cache-fetch";
import { serviceConfig } from "./config/config";
import { RequestClient } from "navient-services-common/lib/requests/request-client";
import { CampaignExecutionDefinition } from "navient-common/lib/models/campaign-execution";
import { Logger } from 'navient-services-common/lib/logger/logger'
import { DateTime } from "luxon";

export class CacheFetcher {
    protected readonly logger: Logger = Logger.getLogger()
    private readonly appNameId: number
    private readonly cacheApiUrl: string
    cacheClient: RequestClient

    constructor() {
        this.appNameId = serviceConfig.cacheFetchAppNameId
        this.cacheApiUrl = serviceConfig.crudApi.crudApiUrl
        this.cacheClient = new RequestClient(this.cacheApiUrl)
    }

    async fetchCacheRecords(campaignExecution: CampaignExecutionDefinition, cacheAmount: number, nonConsent_Records: boolean, retryAttempt: number = 0) {
        const cache_eventActions_ID = campaignExecution.cacheEventActionsId!
        const cacheFetchRequest = new CacheFetchRequest(this.appNameId, cacheAmount, cache_eventActions_ID, nonConsent_Records)

        if (serviceConfig.dev.skipCacheSend) {
            this.logger.log('info', `Simultate fetching ${cacheAmount} records for cache_eventActions_ID ${cache_eventActions_ID}`, { entity: campaignExecution })
            //On response
            const response = this.makeSimulatedCacheResponse(campaignExecution, cacheAmount)
            this.logger.mlog('debug', ['Simulated cache fetch response:', response], { entity: campaignExecution })
            return response
        }
        this.logger.log('http', `${campaignExecution.id} Requesting from cache at URL: ${this.cacheApiUrl}`, { entity: campaignExecution })
        this.logger.mlog('verbose', ['Cache fetch request body:', cacheFetchRequest], { entity: campaignExecution })
        const json = classToPlain(cacheFetchRequest)
        const headers = {
            "Content-Type": "application/json-patch+json"
        }
        const https = serviceConfig.apiCertificate.getHttpsOptions()
        const throwHttpErrors = false
        const response: any = await this.cacheClient.post(json, headers, https, throwHttpErrors)
        const responseBody = Array.isArray(response.body) ? response.body[0] : response.body
        this.logger.log('info', `${campaignExecution.id} - Got cache fetch response ${response.statusCode}, isSuccess: ${responseBody.isSuccess}, statusMessage: ${responseBody.statusMessage}`)
        if (!responseBody || !responseBody.isSuccess) {
            if (responseBody.statusMessage) {
                this.logger.log('info', `Cache fetch response status message: ${responseBody.statusMessage}`, { entity: campaignExecution })
                if (responseBody.statusMessage) {
                    if (retryAttempt >= serviceConfig.cacheFetch.maxRetries) {
                        this.logger.log('info', `Exceeded max retries of ${serviceConfig.cacheFetch.maxRetries}`, { entity: campaignExecution })
                        return undefined
                    }
                    return await new Promise<CacheFetchResponseData | undefined>((resolve, reject) => {
                        setTimeout(async () => {
                            try {
                                const result = await this.fetchCacheRecords(campaignExecution, cacheAmount, nonConsent_Records, retryAttempt+1)
                                resolve(result)
                            } catch (e) {
                                reject(e)
                            }                            
                        },
                        serviceConfig.cacheFetch.retryTimer)
                    })
                }
            }
            return undefined
        }
        if (!responseBody.data) {
            this.logger.log('info', 'Response body has no data')
            return undefined
        }
        const cacheFetchResponse = plainToClass(CacheFetchResponseData, responseBody.data)
        return cacheFetchResponse
    }

    makeSimulatedCacheResponse(campaignExecution: CampaignExecutionDefinition, cacheAmount: number) {
        const { recordsAttempted, recordsToDial, cacheEventActionsId } = campaignExecution
        const newRecordsAttempted = Math.min(recordsAttempted + cacheAmount, recordsToDial);
        cacheAmount = newRecordsAttempted - recordsAttempted
        if (cacheAmount === 0) {
          this.logger.log(
            'info',
            `Cache response simulation - ${recordsAttempted} of ${recordsToDial} dialled, all records dialled`
          );
          return;
        }
        const cacheIDs = []
        const latestAllowableServerTime = DateTime.fromJSDate(campaignExecution.getEndByDate())
            .setZone(serviceConfig.crudApi.crudApiTimezone).toISO({
                includeOffset: false,
                suppressMilliseconds: true
            })
        for (let i = 0; i<cacheAmount; i++) {
            cacheIDs.push({
                cache_ID: 877 + i,
                eventActions_ID: cacheEventActionsId,
                CL_identity: 48 + i,
                PND_identity: 48 + i,
                CL_platformID: (10440048 + i) + '',
                phoneNumber: crypto.randomUUID(),
                statusTCPA: true,
                latestAllowableServerTime
            })
        }
        const cacheFetchResponsePlain = {
            returnData: cacheIDs
        }
        this.logger.log('info', `Cache response simulation - dialled ${recordsAttempted} of ${recordsToDial}`)
        const cacheFetchResponse = plainToClass(CacheFetchResponseData, cacheFetchResponsePlain)
        return cacheFetchResponse
    }
}