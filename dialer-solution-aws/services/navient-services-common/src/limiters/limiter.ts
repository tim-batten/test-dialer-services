import { RateLimiter } from "limiter";

type ChronologicalInterval = 'hour' | 'minute' | 'second' | 'day'

export class RateThrottler {
    limiter: RateLimiter

    constructor(tokensPerInterval: number, interval: ChronologicalInterval) {
        this.limiter = new RateLimiter({ tokensPerInterval, interval });
    }

    async sendRequest (throttledRequest: (...args: any) => any, requestArguments: any[], removedTokens: number, requestThisContext: any) {
        const remainingRequests = await this.limiter.removeTokens(removedTokens);

        const throttledRequestResponse = await throttledRequest.apply(requestThisContext, requestArguments)
        return throttledRequestResponse
    }
}
