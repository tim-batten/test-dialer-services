import { ChainableCommander } from 'ioredis';
import { OutboundContactInfo } from 'navient-common/lib/models/outbound-contact-info';
import { DbInstanceManager } from 'navient-services-common/lib/utils/db-instance-manager';
import { setTimeoutLoop } from 'navient-services-common/lib/utils/general';
import { serviceConfig } from './config/config';
import { RedisClientPool } from 'navient-services-common/lib/db/redis-client-pool';
import { Logger } from 'navient-services-common/lib/logger/logger';
import { CallDispositionStreamPublisher } from './db/call-disposition-stream-publisher';
import { ContactInfoDb } from 'navient-services-common/lib/db/contact-info-db';


export class ContactDispositionHandler {
  logger: Logger = Logger.getLogger();
  contactInfoDb: ContactInfoDb;
  streamPublisher: CallDispositionStreamPublisher;

  constructor(private readonly redisClientPool: RedisClientPool) {
    this.contactInfoDb = DbInstanceManager.getInstance().getDbInstance(ContactInfoDb);
    this.streamPublisher = new CallDispositionStreamPublisher(redisClientPool);
  }

  start() {
    setTimeoutLoop(
      async () => {
        const [readyContactInfos, expiredContactInfos] = await this.redisClientPool.runForcePipeline((pipeline) =>
          Promise.all([
            this.contactInfoDb.getReadyContactInfos(pipeline),
            this.contactInfoDb.getContactInfosOlderThan(serviceConfig.disposition.dispositionTimeout, pipeline),
          ])
        );
        this.logger.log(
          'silly',
          `Contact disposition check: ${JSON.stringify({ readyContactInfos, expiredContactInfos }, null, 2)}`
        );
        this.redisClientPool.runForcePipeline((pipeline) =>
          Promise.all(
            [...readyContactInfos, ...expiredContactInfos].map((contactInfo) =>
              this.handleContactDisposition(contactInfo, pipeline)
            )
          )
        );
        return true;
      },
      'Contact Disposition check',
      serviceConfig.disposition.dispositionCheckFrequency
    );
  }

  handleContactDisposition(contactInfo: OutboundContactInfo, pipeline?: ChainableCommander) {
    this.logger.log('verbose', `Contact disposition: ${JSON.stringify(contactInfo, null, 2)}`);
    this.contactInfoDb.removeOutboundContactInfo(contactInfo.contactId, pipeline);
    this.streamPublisher.addOutboundContactInfo(contactInfo);
  }
}
