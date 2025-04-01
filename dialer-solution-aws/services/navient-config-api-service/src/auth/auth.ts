import { Request, Response } from 'express';
import { CrudAction, makeMissingRoleError } from '../routes/config-entity-route-builder';
import { TokenInfo } from './token-info';
import { ALL_SERVICE_ROLES, ServiceRole } from 'navient-common/lib/types/roles';
import { Logger } from 'navient-services-common/lib/logger/logger';
import { serviceConfig } from '../config/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Mutex } from 'async-mutex';
import { uniqueId } from 'lodash';

const logger = Logger.getLogger();

class TokenCache {
  protected readonly logger: Logger = Logger.getLogger();
  private tokens: { [token: string]: TokenInfo } = {};

  constructor(private maxExpiration: number) {}

  setTokenInfo(tokenInfo: TokenInfo) {
    const now = new Date();
    const tokenExpiresTime = tokenInfo.expiration.getTime();
    const localExpiresTime = now.getTime() + this.maxExpiration;
    if (localExpiresTime < tokenExpiresTime) {
      tokenInfo.expiration = new Date(localExpiresTime);
    }
    this.tokens[tokenInfo.token] = tokenInfo;
    this.logger.log(
      'debug',
      `Added token to cache, token info: ${JSON.stringify(
        {
          ...tokenInfo,
          token: undefined,
        },
        null,
        2
      )}`
    );
  }

  getTokenInfo(token: string) {
    const tokenInfo = this.tokens[token];
    if (!tokenInfo) {
      this.logger.log('http', `Token info doesn't exist`);
      return;
    }
    const now = new Date();
    if (tokenInfo.isExpiredAt(now)) {
      delete this.tokens[token];
      this.logger.log('http', `Token info has expired`);
      return;
    }
    return tokenInfo;
  }

  reset() {
    this.tokens = {};
  }
}

const tokenCache = new TokenCache(60000);
let reqNo = 0;

const verifier = serviceConfig.dev.skipAuthCheck
  ? null
  : CognitoJwtVerifier.create({
      userPoolId: serviceConfig.cognito.userPoolId,
      clientId: serviceConfig.cognito.userPoolClientId,
      tokenUse: 'access',
    });

const mutexMapMutex = new Mutex();
type MutexMapValue = {
  mutex: Mutex;
  waitCount: number;
};
const mutexMap = new Map<string, MutexMapValue>();
const PLACEHOLDER_TOKEN = uniqueId('placeholder_');

async function auth(req: Request, res: Response) {
  const cognitoJwt = (req.headers['x-cognito-jwt'] as string) || PLACEHOLDER_TOKEN;
  const tokenMutex = await mutexMapMutex.runExclusive(() => {
    let tokenMutexInfo = mutexMap.get(cognitoJwt);
    if (!tokenMutexInfo) {
      const newTokenMutex = new Mutex();
      tokenMutexInfo = {
        mutex: newTokenMutex,
        waitCount: 0,
      };
      mutexMap.set(cognitoJwt, tokenMutexInfo);
    }
    tokenMutexInfo!.waitCount++;
    return tokenMutexInfo!.mutex;
  });
  await tokenMutex.runExclusive(async () => {
    if (serviceConfig.dev.skipAuthCheck || (serviceConfig.dev.devAdminToken?.length && cognitoJwt === serviceConfig.dev.devAdminToken)) {
      let tokenInfo = tokenCache.getTokenInfo(cognitoJwt);
      if (!tokenInfo) {
        const clientAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        tokenInfo = new TokenInfo(
          cognitoJwt,
          new Date(Date.now() + 200000),
          [ServiceRole.ADMINISTRATOR],
          `NO_AUTH_USER_${clientAddr}`,
          'Another User'
        );
        tokenCache.setTokenInfo(tokenInfo);
      }
      res.locals.tokenInfo = tokenInfo;
      return;
    }
    if (!cognitoJwt || cognitoJwt === PLACEHOLDER_TOKEN) {
      return res.status(401).send();
    }
    const tokenInfo = tokenCache.getTokenInfo(cognitoJwt);
    if (tokenInfo) {
      res.locals.tokenInfo = tokenInfo;
      return;
    }
    if (!verifier) {
      return res.status(500).send();
    }
    try {
      reqNo++;
      const tokenPayload = await verifier.verify(cognitoJwt);
      const validRoles = (tokenPayload['cognito:groups'] || []).filter((role: string) => ALL_SERVICE_ROLES.includes(role as ServiceRole)) as ServiceRole[];
      const tokenInfo = new TokenInfo(
        cognitoJwt,
        new Date(tokenPayload.exp * 1000),
        validRoles,
        tokenPayload.sub,
        tokenPayload.username
      );
      tokenCache.setTokenInfo(tokenInfo);
      res.locals.tokenInfo = tokenInfo;
      logger.log('http', `Request ${reqNo} authenticated as ${tokenPayload.username} (req: ${reqNo})`);
      return;
    } catch (e) {
      logger.mlog('error', [`Unable to validate cognito jwt ${cognitoJwt} (req: ${reqNo})`, e]);
    }
    return res.status(401).send();
  });
  mutexMapMutex.runExclusive(() => {
    const tokenMutexInfo = mutexMap.get(cognitoJwt);
    if (!tokenMutexInfo) {
      return;
    }
    tokenMutexInfo.waitCount--;
    if (tokenMutexInfo.waitCount === 0) {
      mutexMap.delete(cognitoJwt);
    }
  });
  // const tokenInfo = tokenCache.getTokenInfo(flexJwe)
  // if (tokenInfo) {
  //     res.locals.tokenInfo = tokenInfo
  //     return
  // }
  // const twilioAuth = serviceConfig.twilio
  // try {
  //     const result = await validateFlexToken(flexJwe, twilioAuth.accountSid, twilioAuth.apiKey, twilioAuth.apiSecret)
  //     const workerSid = result.worker_sid
  //     const worker = await twilioClient.taskrouter.v1.workspaces(workspaceSid).workers(workerSid).fetch()
  //     const workerAttributes = JSON.parse(worker.attributes)
  //     if (!workerAttributes.dlr_role) {
  //         return res.status(403).send()
  //     }
  //     const roles = [workerAttributes.dlr_role] as string[]
  //     const tokenInfo = new TokenInfo(flexJwe, new Date(result.expiration), roles, workerSid, worker.friendlyName)
  //     tokenCache.setTokenInfo(tokenInfo)
  //     res.locals.tokenInfo = tokenInfo
  //     return
  // } catch (e) {
  //     logger.mlog('error', [`Unable to validate flex token ${flexJwe} using credentials for account ${twilioAuth.accountSid}`, e])
  //     return res.status(401).send(formatError(e))
  // }
}

async function validateToken(token: string) {}

export function makeAuth(crudAction: CrudAction, ...validRoles: ServiceRole[]) {
  return async (req: Request, res: Response, next: Function) => {
    await auth(req, res);
    if (!res.locals.tokenInfo) {
      return;
    }
    const tokenInfo = res.locals.tokenInfo as TokenInfo;
    if (!tokenInfo.hasRole(...validRoles)) {
      return res.status(403).send(makeMissingRoleError(crudAction, tokenInfo, validRoles));
    }
    next();
  };
}
