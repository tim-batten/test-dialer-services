import {
  ConnectClient,
  ContactFlowType,
  ListContactFlowsCommand,
  ListContactFlowsCommandOutput,
  ListInstancesCommand,
  ListInstancesCommandOutput,
  ListPhoneNumbersCommand,
  ListPhoneNumbersCommandOutput,
  ListQueuesCommand,
  ListQueuesCommandOutput,
  QueueType,
} from '@aws-sdk/client-connect';
import { DescribeCampaignCommand } from '@aws-sdk/client-connectcampaigns';
import { Router } from 'express';
import { ConnectInstanceServiceManager } from 'navient-services-common/lib/utils/connect-helper';
import { listCommandRunner } from 'navient-services-common/lib/utils/connect-utils';
import { sendErrorResponse } from './config-entity-route-builder';
import { Connect } from 'aws-sdk';
import { AwsRegionsTable } from '../models/aws-regions-table';
import got from 'got';
import { Logger } from 'navient-services-common/lib/logger/logger';
import { serviceConfig } from '../config/config';
import { PhoneNumberInfo } from 'navient-common/lib/types/phone-numbers';
import { mapPhoneNumbers } from '../utils/phone-number-api';
// import { getConnectClient } from 'navient-services-common/lib/utils/connect-client-helper';

export function makeConnectRouter() {
  const router = Router();
  const logger = Logger.getLogger();
  const connectServiceManager = ConnectInstanceServiceManager.getInstance();

  // TO GET ConnectClient:
  // const globalConfig = await globalConfigDb.cache.get();
  // const connectClient = getConnectClient(globalConfig);

  // CONNECT_TODO: Implement this when needed
  // const removeEmptyOrNullValues = (payload: any) => Object.keys(payload)
  //     .filter((k: string | number) => payload[k] != null)
  //     .reduce((a: any, k: string | number) => ({ ...a, [k]: payload[k] }), {});

  // // Auth Routes
  // router.get(
  //     authRouteBase,
  //     makeAuth(
  //         CrudAction.READ,
  //         ServiceRole.ADMINISTRATOR,
  //         ServiceRole.ANALYST,
  //         ServiceRole.DEVELOPER,
  //         ServiceRole.READ_ONLY
  //     ),
  //     async (req: any, res: Response) => {
  //         const tokenInfo = res.locals.tokenInfo as TokenInfo;
  //         let entity;
  //         try {
  //             entity = await connectAuthConfigManager.get();
  //             if (!entity) {
  //                 return res.status(404).send(`Entity not found`);
  //             }

  //             return {entity, tokenInfo};
  //         } catch (e) {
  //             res.status(500).send(e);
  //         }
  //     }
  // );

  // router.post(
  //     authRouteBase,
  //     makeAuth(CrudAction.CREATE, ServiceRole.ADMINISTRATOR),
  //     async (req, res) => {
  //         const tokenInfo = res.locals.tokenInfo as TokenInfo;
  //         try {
  //             let connectAuthDefinition = ConnectAuthDefinition.from(req.body);
  //             const entity = await connectAuthConfigManager.get();
  //             if (entity) {
  //                 if (!serviceConfig.dev.skipUpdateConflictChecks) {
  //                     const currentEntityHash = (JSON.stringify({...entity.toPlain()}));
  //                     const hasStateChanged = currentEntityHash !== req.headers['initial-entity-hash'];
  //                     if (hasStateChanged) {
  //                         return res.status(409).send(new Error(`409 Conflict Error`));
  //                     }
  //                 }
  //             }
  //             await connectAuthConfigManager.set(connectAuthDefinition);
  //             return { connectAuthDefinition, tokenInfo };
  //         } catch (e) {
  //             return res.status(401).send(new Error('401 Unauthorized Error in Connect Auth Definition'));
  //         }
  //     });

  // // Contact Routes
  // // Get Contact Info
  // router.get('/connect/contact/{contactId}', async (req, res) => {
  //     try {
  //     const input = {
  //         InstanceId: config.instanceId,
  //         InitialContactId: req.body.contactId
  //     };
  //         const command = new GetContactAttributesCommand(input)
  //         const response = await connect.send(command);

  //         return response;
  //     } catch (error) {
  //         return res.status(401).send(new Error('401 Unauthorized Error in Connect Get Contact Attributes Command'));
  //     }
  // });

  // // Create Contact
  // router.post('connect/contact', async(req, res) => {
  //     try {
  //         let properties = {
  //             Name: req?.body?.name,
  //             Email: req?.body?.email,
  //         };

  //         properties = removeEmptyOrNullValues(properties);

  //         const input = {
  //             InstanceId: config?.instanceId,
  //             ContactId: undefined,
  //             ContactAttributes: properties,
  //             Description: req?.body?.description,
  //             CustomerEndpoint: {
  //                 Address: req?.body?.phoneNumber,
  //                 Type: 'TELEPHONE_NUMBER'
  //             }
  //         };
  //     const command = new UpdateContactCommand(input);
  //     const response = await connect.send(command);

  //     return response;
  // } catch (e) {
  //         return res.status(401).send(new Error('401 Unauthorized Error in Connect Create Contact'));
  //     }
  // });

  // // Create Contact & Start Outbound Voice
  // router.post('/connect/contact/{contactId}/voice', async (req, res) => {
  // try {
  //     let properties = {
  //         Name: req?.body?.name,
  //         Email: req?.body?.email,
  //     };

  //     properties = removeEmptyOrNullValues(properties);

  //     const params = {
  //         DestinationPhoneNumber: req?.body?.phoneNumber,
  //         ContactFlowId: req?.body?.contactFlowId,
  //         InstanceId: config?.instanceId,
  //         QueueId: req?.body?.taskQueue,
  //         ContactAttributes: properties,
  //     };
  //     const command = new StartOutboundVoiceContactCommand(params);
  //     const response = await connect.send(command);

  //     return response;
  // } catch (e) {
  //     return res.status(400).send(new Error('400 Request to add contact to connect flow has failed.'));
  // }
  // });

  // // Update Contact
  // router.post('connect/contact/{contactId}', async(req, res) => {
  //     try {
  //         let properties = {
  //             Name: req?.body?.name,
  //             Email: req?.body?.email,
  //             Phone_Number: req?.body?.phoneNumber
  //         };

  //         properties = removeEmptyOrNullValues(properties);

  //         const params = {
  //             Attributes: properties,
  //             ContactId: req?.body?.contactId,
  //             InstanceId: config?.instanceId
  //         };
  //         const command = new UpdateContactCommand(params);
  //         const response = await connect.send(command);

  //         return response;
  //     } catch (e) {
  //         return res.status(400).send(new Error('400 Request to update contact in connect has failed.'));
  //     }
  // });

  router.get('/connect/contact-flows', async (req, res) => {
    const { connectClient, connectConfig } = await connectServiceManager.get();
    try {
      const flowTypes = typeof req.query.flowTypes === 'string' ? req.query.flowTypes.split(',') as ContactFlowType[] : undefined;
      const command = new ListContactFlowsCommand({
        InstanceId: connectConfig.InstanceId,
        ContactFlowTypes: flowTypes,
      });
      const contactFlows = await listCommandRunner<ListContactFlowsCommandOutput, 'ContactFlowSummaryList'>(
        connectClient,
        command,
        'ContactFlowSummaryList'
      );
      const mappedFlows = contactFlows.map(({ Id, Name, ContactFlowType }) => ({
        Id,
        Name,
        ContactFlowType,
      }));
      return res.send(mappedFlows);
    } catch (e) {
      console.error(e);
      return res.status(400).send(new Error('400 - Request to get list of contact flows has failed.'));
    }
  });

  // // Get Specific Contact Flow
  // router.get('/connect/contact-flow', async (req, res) => {
  // try {
  //     const command = new DescribeContactFlowCommand({
  //         InstanceId: config.instanceId,
  //         ContactFlowId: req.body.contactFlowId,
  //     });
  //     const response = await connect.send(command);

  //     return response;
  // } catch (e) {
  //     return res.status(400).send(new Error('400 - Request to get contact flow has failed.'));
  // }
  // });

  // // Post Contact to Contact Flow
  // router.post('/connect/contact-flow', async (req, res) => {
  //     try {
  //     const params = new StartOutboundVoiceContactCommand ({
  //         InstanceId: config?.instanceId,
  //         ContactFlowId: req?.body?.contactFlowId,
  //         DestinationPhoneNumber: req?.body?.phoneNumber,
  //         Attributes: {
  //             name: req?.body?.name,
  //         },
  //     });

  //         const response = await connect.send(params);

  //         return response;
  //     } catch (error) {
  //         return res.status(400).send(new Error('400 - Request to post contact to contact flow has failed.'));
  //     }
  // });

  // // Campaigns
  // // Get List of Campaigns
  // router.get('connect/campaigns', async (req, res) => {
  //     try {
  //         const input = {
  //             filters: {
  //                 instanceIdFilter: {
  //                     value: config?.instanceId,
  //                     operator: config?.instanceId
  //                 }
  //             },
  //             InstanceId: config?.instanceId,
  //             maxResults: 100,
  //         };
  //         const command = new ListCampaignsCommand(input);
  //         const response = await campaignClient.send(command);

  //         return response;
  //     } catch (e) {
  //         return res.status(400).send(new Error('400 - Request to get campaign has failed.'));
  //     }
  // });

  // Get Single Campaign
  router.get('/connect/campaigns/:connectCampaignId', async (req, res) => {
    const { connectCampaignsClient, connectConfig } = await connectServiceManager.get();
    const connectCampaignId = req.params.connectCampaignId;
    try {
      const command = new DescribeCampaignCommand({
        id: connectCampaignId,
      });
      const response = await connectCampaignsClient.send(command);
      return res.send(response.campaign);
    } catch (e) {
      return res.status(500).send(e);
    }
  });

  // Queues
  // Get List of Queues
  router.get('/connect/queues', async (req, res) => {
    const { connectClient, connectConfig } = await connectServiceManager.get();
    const queueTypes = typeof req.query.queueTypes === 'string' ? req.query.queueTypes.split(',') as QueueType[] : undefined;
    try {
      const queueSummaries = await listCommandRunner<ListQueuesCommandOutput, 'QueueSummaryList'>(
        connectClient,
        new ListQueuesCommand({
          InstanceId: connectConfig.InstanceId,
          QueueTypes: queueTypes,
        }),
        'QueueSummaryList'
      );

      return res.send(
        queueSummaries.map((queueSummary) => ({
          Id: queueSummary.Id,
          Name: queueSummary.Name,
          QueueType: queueSummary.QueueType,
        }))
      );
    } catch (e) {
      return sendErrorResponse(res, e, 400);
    }
  });

  router.get('/connect/instances/:region', async (req, res) => {
    try {
      const region = req.params.region;
      const connectClient = new ConnectClient({ region, credentials: connectServiceManager.awsCredentialsConfig });
      const instances = await listCommandRunner<ListInstancesCommandOutput, 'InstanceSummaryList'>(
        connectClient,
        new ListInstancesCommand({}),
        'InstanceSummaryList'
      );
      const activeOutboundInstances = instances.filter(
        (instanceSummary) =>
          instanceSummary.OutboundCallsEnabled === true && instanceSummary.InstanceStatus === 'ACTIVE'
      );
      return res.status(200).send(activeOutboundInstances);
    } catch (e) {
      return res.status(500).send(e);
    }
  });

  router.get('/connect/regions', async (req, res) => {
    try {
      const regionResponse = await got.get('https://api.regional-table.region-services.aws.a2z.com/index.json');
      const regionTable = JSON.parse(regionResponse.body) as AwsRegionsTable;
      const connectRegions = regionTable.prices.filter(
        ({ attributes }) => attributes['aws:serviceName'] === 'Amazon Connect'
      );
      return res.status(200).send(connectRegions.map(({ attributes }) => attributes['aws:region']));
    } catch (e) {
      logger.mlog('error', ['Error fetching connect regions', e]);
      return res
        .status(200)
        .send([
          'af-south-1',
          'ap-northeast-1',
          'ap-northeast-2',
          'ap-southeast-1',
          'ap-southeast-2',
          'ca-central-1',
          'eu-central-1',
          'us-east-1',
          'us-gov-west-1',
          'us-west-2',
          'eu-west-2',
        ]);
    }
  });

  router.get('/connect/phone-numbers', async (req, res) => {
    try {
      const { connectClient, connectConfig } = await connectServiceManager.get();
      
      const phoneNumberInfos = await listCommandRunner<ListPhoneNumbersCommandOutput, 'PhoneNumberSummaryList'>(
        connectClient,
        new ListPhoneNumbersCommand({
          InstanceId: connectConfig.InstanceId,
        }),
        'PhoneNumberSummaryList'
      );
      const phoneNumbers = phoneNumberInfos.reduce((acc, phoneNumberInfo) => {
        if (phoneNumberInfo.PhoneNumber) {
          acc.push(phoneNumberInfo.PhoneNumber);
        }
        return acc;
      }, [] as string[]);
      const phoneNumberMappings = await mapPhoneNumbers(phoneNumbers);
      return res.status(200).send({
        phoneNumbers: phoneNumberMappings,
      });
    } catch (e) {
      res.status(500).send(e);
    }
  });

  // // Get specific Queue
  // router.get('/connect/queues/{queueId}', async (req, res) => {
  //     try {
  // const command = new DescribeQueueCommand({ InstanceId: config.instanceId, QueueId: req.body.queueId});
  // const response = await connect.send(command);

  // return response;
  //     } catch (e) {
  //         return res.status(400).send(new Error('400 - Request to get queue has failed.'));
  //     }
  // });

  return router;
}
