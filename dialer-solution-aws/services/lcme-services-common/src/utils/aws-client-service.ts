import { ConnectClient } from '@aws-sdk/client-connect';
import { Logger } from '../logger/logger';
import { ConnectCampaignsClient } from '@aws-sdk/client-connectcampaigns';

type CredsArgType = NonNullable<ConstructorParameters<typeof ConnectClient>[0]['credentials']>;

export class AWSClientsContainer {
  private _connectClient?: ConnectClient;
  private _connectCampaignsClient?: ConnectCampaignsClient;

  constructor(readonly region: string, readonly credentials: CredsArgType) {}

  get connectClient(): ConnectClient {
    if (!this._connectClient) {
      this._connectClient = new ConnectClient({ region: this.region, credentials: this.credentials });
    }
    return this._connectClient;
  }

  get connectCampaignsClient(): ConnectCampaignsClient {
    if (!this._connectCampaignsClient) {
      this._connectCampaignsClient = new ConnectCampaignsClient({ region: this.region, credentials: this.credentials });
    }
    return this._connectCampaignsClient;
  }
}

export class AWSClientService {
  // Note: Unsure on SDK client concurrency model, for now not using a pool but if we need to
  // can use generic client pool
  public static readonly instance: AWSClientService = new AWSClientService();
  protected readonly logger: Logger = Logger.getLogger();
  private readonly clientMap: Map<string, AWSClientsContainer> = new Map();
  private constructor() {}

  getClientContainer(region: string, creds: CredsArgType) {
    const mapKey = `${region}:${JSON.stringify(creds)}`;
    let clientsContainer = this.clientMap.get(mapKey);
    if (!clientsContainer) {
      clientsContainer = new AWSClientsContainer(region, creds);
      this.clientMap.set(mapKey, clientsContainer);
    }
    return clientsContainer;
  }

  getConnectClient(region: string, credentials: CredsArgType): ConnectClient {
    return this.getClientContainer(region, credentials).connectClient;
  }

  getConnectCampaignsClient(region: string, credentials: CredsArgType): ConnectCampaignsClient {
    return this.getClientContainer(region, credentials).connectCampaignsClient;
  }
}
