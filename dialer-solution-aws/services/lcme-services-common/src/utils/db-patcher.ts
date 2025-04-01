import { exit } from 'process';
import { DbIntegrityCheckOptions } from '../config/db-integrity-check';
import { CampaignConfigDb } from '../db/campaign-config-db';
import { CampaignExecutionDb } from '../db/campaign-execution-db';
import { ContactListConfigDb } from '../db/contact-list-config-db';
import { DialerDbInfoDb } from '../db/dialer-db-info-db';
import { FilterConfigDb } from '../db/filter-config-db';
import { HolidayDb } from '../db/holiday-db';
import { RedisClientPool } from '../db/redis-client-pool';
import { ScheduleConfigDb } from '../db/schedule-config-db';
import { ScheduleExecutionDb } from '../db/schedule-execution-db';
import { Logger } from '../logger/logger';
import { ContactInfoDb } from '../db/contact-info-db';

const entityTypes = ['schedule', 'campaign', 'contact_list', 'filter', 'campaign_execution', 'schedule_execution'];
const logger = Logger.getLogger();

export async function patchDb(
  redisClientPool: RedisClientPool,
  integrityCheckOptions: DbIntegrityCheckOptions,
  serviceConfig: any
) {
  const dialerDbInfoDb = new DialerDbInfoDb(redisClientPool);
  const patch = redisClientPool.redisConf.patchDbOnStart;
  const currentVersion = '1.7.0';
  const [variant, dbVersion] = await Promise.all([
    dialerDbInfoDb.getVariant().catch((e) => logger.log('info', e)),
    dialerDbInfoDb.getVersion().catch((e) => logger.log('info', e)),
  ]);
  // Must check DB version as variant is new for amazon_connect - it not existing is a legit scenario on initial variant
  if (dbVersion && variant !== 'amazon_connect') {
    logger.log('info', `Cannot use this dialer namespace, it is not variant 'amazon_connect'`);
    exit();
  }
  // Check pre-lock - if it's already at the latest there's no need to lock (if not must check again when lock acquired)
  if (dbVersion !== currentVersion) {
    if (!patch) {
      logger.log(
        'warn',
        `Config set to skip patching but DB is currently at an incompatible version ${dbVersion}. Required version ${currentVersion}`
      );
      exit();
    }
    logger.log('info', `Dialer DB is at version ${dbVersion}, patching to ${currentVersion}`);
  } else {
    if (!integrityCheckOptions.enabled) {
      logger.log(
        'info',
        `Dialer DB is already at latest version (${dbVersion}) and integrity check disabled, not performing any DB maintenance`
      );
      return;
    }
  }

  const lockKey = redisClientPool.makeBaseRedisKey('db_patch');
  const patchLockExpiry = 60000;
  logger.log(
    'info',
    `Attempting to acquire lock to perform patching/integrity check operations on DB. This lock will automatically expire in ${patchLockExpiry}ms. If this is the current log line another process currently has the lock`
  );
  const lock = await redisClientPool.redlock
    .acquire([lockKey], patchLockExpiry, {
      ...redisClientPool.redlock.settings,
      retryCount: 600,
      retryDelay: 1000,
    })
    .catch((e) => {
      logger.log(
        'info',
        `Unable to acquire lock when patching the DB. Expiry time for locks is ${patchLockExpiry} - try running the service again`
      );
      exit();
    });
  try {
    await ensureGlobal(redisClientPool);
    let dbVersion = await dialerDbInfoDb.getVersion().catch((e) => logger.log('info', e));
    while (dbVersion !== currentVersion) {
      if (dbVersion === null) {
        await patchTo1_7(redisClientPool, dialerDbInfoDb);
      } else {
        logger.log('error', `Current dialer DB version ${dbVersion} not recognized, cannot patch`);
        await lock.release();
        exit();
      }
      dbVersion = await dialerDbInfoDb.getVersion().catch((e) => logger.log('info', e));
      logger.log('info', `Dialer DB patched to ${dbVersion}`);
    }
    await cleanup(redisClientPool, integrityCheckOptions);
  } finally {
    await lock.release();
    logger.log('info', `Lock released`);
  }
}

async function patchTo1_7(redisClientPool: RedisClientPool, dialerDbInfoDb: DialerDbInfoDb) {
  const ver = '1.7.0';
  logger.log('info', `Dialer DB is not initialized, initializing to variant 'amazon_connect' and version to '1.7.0'`);
  await dialerDbInfoDb.setVariant('amazon_connect');
  await dialerDbInfoDb.setVersion(ver);
}

async function ensureGlobal(redisClientPool: RedisClientPool) {
  const globalKey = redisClientPool.makeBaseRedisKey('global_config');
  const globalJson = await redisClientPool.run((redisClient) => {
    return redisClient.call('JSON.GET', globalKey);
  });
  let globalObj: any;
  if (globalJson) {
    try {
      globalObj = JSON.parse(globalJson as string);
      return;
    } catch (e) {
      logger.mlog('error', ['Failed to parse global from DB:', e]);
    }
  }
  logger.log('info', "Global config doesn't exist, creating");
  globalObj = {
    DialerDefaults: {
      ScheduleTimezone: 'America/New_York',
      ContactFlowId: 'ENTER_CONTACT_FLOW_ID_HERE',
      MaxCPA: 0,
      InitialCpaMin: 1,
      InitialCpaMax: 100,
      InitialPacingDurationMin: 1,
      InitialPacingDurationMax: 15,
      InitialPacingSamplesMin: 1,
      InitialPacingSamplesMax: 1000,
      AbandonmentIncrementMin: 0,
      AbandonmentIncrementMax: 3,
      CpaModifierMin: 0,
      CpaModifierMax: 5,
      AbaTargetRateMin: 1,
      AbaTargetRateMax: 10,
      CallLimitRecordMin: 1,
      CallLimitRecordMax: 10,
      CallLimitPhoneMin: 1,
      CallLimitPhoneMax: 10,
      ScheduleLoopsMin: 1,
      ScheduleLoopsMax: 100,
      ConcurrentCallsMin: 1,
      ConcurrentCallsMax: 100,
    },
    Connect: {
      InstanceArn: 'INSERT_INSTANCE_ID_HERE',
      AwsRegion: 'us-east-1',
      ConnectProjectCPS: 100,
    },
  };
  await redisClientPool.run((redisClient) => {
    return redisClient.call('JSON.SET', globalKey, '.', JSON.stringify(globalObj));
  });
}

async function cleanup(redisClientPool: RedisClientPool, integrityCheckOptions: DbIntegrityCheckOptions) {
  const campaignExecutionDb = new CampaignExecutionDb(redisClientPool);
  const scheduleExecutionDb = new ScheduleExecutionDb(redisClientPool);
  const campaignDb = new CampaignConfigDb(redisClientPool);
  const scheduleDb = new ScheduleConfigDb(redisClientPool);
  const contactListConfigDb = new ContactListConfigDb(redisClientPool);
  const filterConfigDb = new FilterConfigDb(redisClientPool);
  const holidayDb = new HolidayDb(redisClientPool);
  const contactInfoDb = new ContactInfoDb(redisClientPool);

  await campaignExecutionDb.integrityCheck(integrityCheckOptions);
  await scheduleExecutionDb.integrityCheck(integrityCheckOptions);
  await campaignDb.integrityCheck(integrityCheckOptions);
  await scheduleDb.integrityCheck(integrityCheckOptions);
  await contactListConfigDb.integrityCheck(integrityCheckOptions);
  await filterConfigDb.integrityCheck(integrityCheckOptions);
  await holidayDb.integrityCheck(integrityCheckOptions);
  await contactInfoDb.integrityCheck(integrityCheckOptions);
}
