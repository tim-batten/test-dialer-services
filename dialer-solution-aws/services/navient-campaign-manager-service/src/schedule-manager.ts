import { ScheduleConfigDb } from 'navient-services-common/lib/db/schedule-config-db';
import { RedisClientPool } from 'navient-services-common/lib/db/redis-client-pool';
import { ScheduleDefinition } from 'navient-common/lib/models/schedule';
import { ScheduleExecutionManager } from './schedule-execution-manager';
import { Logger } from 'navient-services-common/lib/logger/logger';
import { repeatFuncOnInterval } from 'navient-services-common/lib/utils/general';
import { InactiveServiceInfoWithJobs, ServiceManager } from 'navient-services-common/lib/utils/service-manager';
import { HolidayDb } from 'navient-services-common/lib/db/holiday-db';
import { RecurrenceDateExclusion } from 'navient-common/lib/utils/rrule-helper';

export type ScheduleRunTime = {
  schedule: ScheduleDefinition;
  start: Date;
  end: Date;
};

export class ScheduleManager {
  protected readonly logger: Logger = Logger.getLogger();
  protected readonly serviceManager: ServiceManager = ServiceManager.getInstance();
  private scheduleDb: ScheduleConfigDb;
  private holidayDb: HolidayDb;
  private scheduleExecutionManager: ScheduleExecutionManager;
  private isMonitor: boolean = false;
  private scheduleMonitorJobName: string;

  constructor(private readonly redisClientPool: RedisClientPool) {
    this.scheduleDb = new ScheduleConfigDb(redisClientPool);
    this.holidayDb = new HolidayDb(redisClientPool);
    this.scheduleExecutionManager = new ScheduleExecutionManager(redisClientPool);
    this.scheduleMonitorJobName = this.redisClientPool.makeBaseRedisKey('schedule_monitor');
  }

  public async initialise() {
    try {
      await this.serviceManager.acquireJob(this.scheduleMonitorJobName);
      await this.scheduleExecutionManager.stopOldExecutions();
    } catch (e: any) {
      this.logger.log('info', e.message);
    }
    this.serviceManager.addInactiveStatusListener(this);
    this.start();
  }

  async start() {
    const ONE_MINUTE = 60 * 1000;
    repeatFuncOnInterval(
      async () => {
        return await this.checkSchedules();
      },
      ONE_MINUTE,
      true
    );
  }

  getScheduleIntendedRunningStatesAt(
    datetime: Date,
    schedules: ScheduleDefinition[],
    exclusions: RecurrenceDateExclusion[]
  ): ScheduleRunTime[] {
    return schedules
      .map((schedule) => {
        const runningTime = schedule.getRunningTimeAt(datetime, exclusions);
        if (!runningTime) {
          return;
        }
        return {
          schedule,
          start: runningTime.start,
          end: runningTime.end,
        };
      })
      .filter((state) => state) as ScheduleRunTime[];
  }

  async servicesBecameInactive(services: InactiveServiceInfoWithJobs[]): Promise<void> {
    if (!this.isMonitor) {
      services.forEach(async (serviceEntry) => {
        if (serviceEntry.jobs.includes(this.scheduleMonitorJobName)) {
          this.logger.log(
            'info',
            `Schedule worker ${serviceEntry.id} has become inactive - attempting to become schedule worker`
          );
          try {
            await this.serviceManager.acquireJob(this.scheduleMonitorJobName, serviceEntry.id);
          } catch (e: any) {
            this.logger.log('info', e.message);
            return;
          }
          this.logger.log('info', `Schedule worker ${serviceEntry.id} has become schedule worker`);
          this.checkSchedules();
        }
      });
    }
  }

  private async checkSchedules() {
    const currentScheduleMonitor = await this.serviceManager.getWorkerForJob(this.scheduleMonitorJobName);
    if (currentScheduleMonitor) {
      this.isMonitor = currentScheduleMonitor === this.serviceManager.serviceInfo.id;
    } else {
      try {
        await this.serviceManager.acquireJob(this.scheduleMonitorJobName);
        this.isMonitor = true;
      } catch (e: any) {
        this.logger.log('info', e.message);
        return true;
      }
    }
    if (!this.isMonitor) {
      this.logger.log(
        'info',
        `This schedule manager (${this.serviceManager.serviceInfo.id}) is not currently assigned the schedule monitor job, returning`
      );
      return true;
    }
    const [allSchedules, allHolidays] = await this.redisClientPool.runForcePipeline((pipeline) => {
      return Promise.all([
        this.scheduleDb.getAllAsList(pipeline),
        this.holidayDb.getAllAsRecurrenceDateExclusions(pipeline),
      ]);
    });
    const now = new Date();
    this.logger.log('debug', `Checking schedule run states at ${now}`);
    const scheduleIntendedStates = this.getScheduleIntendedRunningStatesAt(now, allSchedules, allHolidays);
    this.scheduleExecutionManager.checkRunningStates(scheduleIntendedStates);
    return true;
  }
}
