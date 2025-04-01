import axios, { AxiosResponse } from 'axios';
import { config_baseURL } from '../utils';
import { ApiStatus } from 'navient-common/lib/types/api-status';

export const getApiStatus = async () => {
  const payload = {
    params: {},
  };
    const response = (await axios.get(
      `${config_baseURL()}/status`,
    )) as AxiosResponse<ApiStatus>;
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
};
