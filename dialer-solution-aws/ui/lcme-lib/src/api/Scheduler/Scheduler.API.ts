import {
  ISchedule,
  ModType,
} from '../../components/commons/types/schedulerTypes';
import { get, deletE, patch, post } from '../utils';
import hash from 'object-hash';
import {
  IHoliday,
  IHolidayID,
} from '../../components/commons/types/holidayTypes';
import { AxiosResponse } from 'axios';
import { ScheduleApiResponse } from 'lcme-common/lib/types/schedules-api';

export const getSchedulerList = async () => {
  const payload = {
    params: {},
  };
  return await get('/schedules/all', payload);
};

export const deleteSchedule = async (
  id: string,
  type: ModType,
  date: string,
) => {
  const payload = {
    params: {},
  };
  if (type === 'series') {
    await deletE(`schedules/${id}`, payload);
  } else {
    return {
      data: await (await deletE(`schedules/${id}/${date}`, payload)).data,
      id: id,
    };
  }
  return id;
};

export const checkSchedule = async (id: string) => {
  const payload = {
    params: {},
  };
  return deletE(`schedules/${id}?skipdeletion=true`, payload);
};

export const updateSchedule = async (
  editedScheduleConfig: ISchedule,
  id: string,
  initialScheduleConfig: ISchedule,
) => {
  delete initialScheduleConfig.ScheduleTimeZone;
  delete initialScheduleConfig['prjacc'];
  const payload = { ...editedScheduleConfig, id };
  const headers = {
    'initial-entity-hash': hash(JSON.stringify(initialScheduleConfig)),
  };

  return {
    data: await (await post(`schedules`, payload, { headers })).data,
    // data: await (await patch(`schedules/${id}`, payload, { headers })).data,
    id: id,
  };
};

// INSERT HASH FUNCTIONALITY HERE:
export const updateOccurrence = async (
  schedule: ISchedule,
  id: string,
  date: string,
) => {
  const payload = schedule;
  return {
    data: await (
      await post(`/schedules/${id}/${date}`, { ...payload, id })
    ).data,
    id: id,
  };
};

export const enableSchedule = async (
  id: string,
  date: string,
  type: ModType,
  enable: boolean,
) => {
  const payload = {};
  const endpoint =
    type === 'occurrence'
      ? `schedules/${id}/${enable ? 'enable' : 'disable'}/${date}`
      : `schedules/${id}/${enable ? 'enable' : 'disable'}`;
  return {
    data: await (await post(endpoint, payload)).data,
    id: id,
  };
};

export const addSchedule = async (schedule: ISchedule) => {
  const payload = schedule;

  return await post(`schedules`, payload);
};

export const getContactFilterList = async () => {
  const payload = {
    params: {},
  };

  return await get('/filters?isPhone=false&isFilter=true', payload);
};

export const getPhoneFilterList = async () => {
  const payload = {
    params: {},
  };

  return await get('/filters?isPhone=true&isFilter=true', payload);
};

export const getContactSortingList = async () => {
  const payload = {
    params: {},
  };

  return await get('/filters?isPhone=false&isFilter=false', payload);
};

// export const getCampaignListForScheduler = async () => {
//   const payload = {
//     params: {},
//   };
//   return await get('/campaigns/all', payload);
// };

export const getFilters = async () => {
  const payload = {
    params: {},
  };
  return await get('/filters/all', payload);
};

export const getSchedulesBetweenTimes = async (startTime, endTime) => {
  const payload = {
    params: {},
  };
  const response = await get(
    `/schedules?startTime=${startTime}&endTime=${endTime}`,
    payload,
  );
  return response as AxiosResponse<ScheduleApiResponse>;
};

export const getAllHolidays = async () => {
  const payload = {
    params: {},
  };
  return await get('/holidays/all', payload);
};

export const addHoliday = async (holiday: IHoliday) => {
  const payload = holiday;

  return await post(`holidays`, payload);
};

export const updateHoliday = async (
  holiday: IHoliday,
  initialHoliday: IHolidayID,
) => {
  delete initialHoliday['prjacc'];
  const payload = holiday;
  const initialConfigHash = hash(JSON.stringify(initialHoliday));
  const headers = {
    'initial-entity-hash': initialConfigHash,
  };

  return {
    data: await (
      await patch(`holidays/${initialHoliday.id}`, payload, { headers })
    ).data,
    id: initialHoliday.id,
  };
};

export const deleteHoliday = async (id: string) => {
  const payload = {
    params: {},
  };
  await deletE(`holidays/${id}`, payload);
  return id;
};
