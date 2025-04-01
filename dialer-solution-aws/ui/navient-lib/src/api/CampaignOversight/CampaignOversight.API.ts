import { duration } from 'moment-timezone';
import { get, deletE, patch, post } from '../utils';
import { AxiosResponse } from 'axios';
import { OversightStats } from 'navient-common/lib/types/oversight-stats';

export const getScheduleExecutions = async () => {
  const payload = {
    params: {},
  };

  return await get('/stats/schedule-execution/all', payload) as AxiosResponse<OversightStats[]>;
};

export const controlScheduleExecution = async (
  action: string,
  scheduleExecutionId: string,
  runtimeParameters?: any,
) => {
  const payload = {
    action: action,
    scheduleExecutionId: scheduleExecutionId,
    runtimeParameters: runtimeParameters,
  };

  return await post('/schedules/control', payload);
};
