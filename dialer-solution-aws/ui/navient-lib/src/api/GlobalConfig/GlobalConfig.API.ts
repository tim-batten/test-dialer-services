import hash from 'object-hash';
import { IGlobalConfig } from '../../components/commons/types/globalTypes';
import { get, post } from '../utils';
import { AxiosResponse } from 'axios';
import { ConnectInstanceInfo } from '../../types/connect-instance';

// This is what's used for global validation in forms
export const getDialerDefaults = async () => {
  const payload = {
    params: {},
  };

  return await get('/global/dialerdefaults', payload);
};

// This is what's used for populating the admin form in the Config UI (to SET the global defaults)
export const getGlobalConfig = async () => {
  const payload = {
    params: {},
  };


  return (await get('/global', payload)) as AxiosResponse<IGlobalConfig>;
};

export const updateGlobalConfig = async (
  global: any,
  initialGlobalConfig: IGlobalConfig,
) => {
  const payload = global;

  const initialConfigHash = hash(JSON.stringify(initialGlobalConfig));

  const headers = {
    'initial-entity-hash': initialConfigHash,
  };

  return await post('global', payload, { headers });
};

export const getRegions = async () => {
  const payload = {
    params: {},
  };

  return await get('/connect/regions', payload);
};

export const getInstanceARNs = async (region: string) => {
  const payload = {
    params: {},
  };

  return await get(`/connect/instances/${region}`, payload) as AxiosResponse<ConnectInstanceInfo[]>;
};

