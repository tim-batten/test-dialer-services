import {
  getScheduleExecutions as getScheduleExecution,
  controlScheduleExecution as controlAScheduleExecution,
} from '@lcme/common';
import { CampaignPacingDefinition } from 'lcme-common/lib/models/campaign';

export const GET_SCHEDULE_EXECUTIONS = 'GET_SCHEDULE_EXECUTIONS';
export const CONTROL_SCHEDULE_EXECUTION = 'CONTROL_SCHEDULE_EXECUTION';

export function getScheduleExecutions() {
  return {
    type: GET_SCHEDULE_EXECUTIONS,
    /** you can call api here */
    payload: getScheduleExecution(),
  };
}

export function controlScheduleExecution(
  action: string,
  scheduleExecutionId: string,
  pacing?: Partial<CampaignPacingDefinition>,
) {
  return {
    type: CONTROL_SCHEDULE_EXECUTION,
    payload: controlAScheduleExecution(action, scheduleExecutionId, pacing),
  };
}
