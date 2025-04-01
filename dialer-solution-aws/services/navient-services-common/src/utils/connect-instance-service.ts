import { ConnectConfigDefinition } from 'navient-common/lib/models/global-config';
import { AWSClientService, AWSClientsContainer } from './aws-client-service';
import { AwsCredentialsConfig } from '../config/aws-credentials-config';

export class ConnectInstanceService {
  private clientsContainer: AWSClientsContainer;
  connectConfig: ConnectConfigDefinition;

  constructor(connectConfig: ConnectConfigDefinition, credsConfig: AwsCredentialsConfig) {
    this.connectConfig = connectConfig;
    this.clientsContainer = AWSClientService.instance.getClientContainer(connectConfig.AwsRegion, credsConfig);
  }

  get connectClient() {
    return this.clientsContainer.connectClient;
  }

  get connectCampaignsClient() {
    return this.clientsContainer.connectCampaignsClient;
  }


}