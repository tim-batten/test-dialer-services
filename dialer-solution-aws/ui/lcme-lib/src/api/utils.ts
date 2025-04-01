/* eslint-disable no-unused-vars */
import axios, {
  Axios,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosInterceptorManager,
} from 'axios';
import { config, accounts } from '../frontend-config';
import { on } from 'events';

type RequestInterceptor = {
  onFullfilled?: (
    config: AxiosRequestConfig<any>,
  ) => AxiosRequestConfig<any> | Promise<AxiosRequestConfig<any>>;
  onRejected?: (error: any) => any;
};
type ResponseInterceptor = {
  onFullfilled?: (
    config: AxiosResponse<any>,
  ) => AxiosResponse<any> | Promise<AxiosResponse<any>>;
  onRejected?: (error: any) => any;
};

class InterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  removeRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors = this.requestInterceptors.filter(
      (i) => i !== interceptor,
    );
  }

  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  removeResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors = this.responseInterceptors.filter(
      (i) => i !== interceptor,
    );
  }

  async applyRequestInterceptors(config: AxiosRequestConfig<any>) {
    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onFullfilled) {
        config = await interceptor.onFullfilled(config);
      }
    }
    return config;
  }

  async applyRequestErrorInterceptors(error: any) {
    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRejected) {
        await interceptor.onRejected(error);
      }
    }
  }

  async applyResponseInterceptors(response: AxiosResponse<any>) {
    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onFullfilled) {
        response = await interceptor.onFullfilled(response);
      }
    }
    return response;
  }

  async applyResponseErrorInterceptors(error: any) {
    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onRejected) {
        await interceptor.onRejected(error);
      }
    }
  }
}

export const interceptorManager = new InterceptorManager();

interceptorManager.addRequestInterceptor({
  onRejected: (error) => {
    console.log('request rejected!', error);
    return Promise.reject(error);
  },
});

interceptorManager.addResponseInterceptor({
  onRejected: (error) => {
    return Promise.reject(error);
  },
});

export const baseURL = () =>
  sessionStorage.getItem('project_account') || config.apiUrl;
export const config_baseURL = () =>
  sessionStorage.getItem('config_account') || config.apiUrl;

export const set_config_baseURL = (data) =>
  sessionStorage.setItem('config_account', data);
export const set_base_configURL = () =>
  sessionStorage.setItem('config_account', config_baseURL());

export const get_config_account = () => {
  return accounts.find((a) => a.url === config_baseURL());
};

/**
 * Force the api to use config account instead of project account in using get()
 * @param override
 * @returns
 */
export const set_account_override = (override: '0' | '1') =>
  sessionStorage.setItem('override_pa', override);

export const get_account_override = () => sessionStorage.getItem('override_pa');

export const isBaseURLAll = () => baseURL() === 'All';

export const allDataFilter = <T>(data: T[], type?: string) => {
  if (isBaseURLAll()) {
    if (type) {
      return data;
    } else {
      return data.filter((tg: any) => tg?.prjacc?.url === config_baseURL());
    }
  } else {
    return data;
  }
};

const axiosInstance = axios.create({
  baseURL: config_baseURL(),
});

export function post(url: string, payload: any, headers?: any) {
  axiosInstance.defaults.baseURL = config_baseURL();
  return axiosInstance.post(url, payload, headers);
}

export function get(url: string, payload: any) {
  axiosInstance.defaults.baseURL =
    get_account_override() === '1' ? config_baseURL() : baseURL();

  return isBaseURLAll()
    ? getAll(url, payload)
    : axiosInstance.get(url, payload);
}

export function put(url: string, payload: any) {
  axiosInstance.defaults.baseURL = config_baseURL();
  return axiosInstance.put(url, payload);
}

export function patch(url: string, payload: any, headers?: any) {
  axiosInstance.defaults.baseURL = config_baseURL();
  return axiosInstance.patch(url, payload, headers);
}

export function deletE(url: string, payload: any) {
  axiosInstance.defaults.baseURL = config_baseURL();
  return axiosInstance.delete(url, payload);
}

async function getAll(url: string, payload: any) {
  try {
    return await Promise.all(
      accounts.map(async (acc) => {
        return axios(
          await interceptorManager.applyRequestInterceptors({
            url: `${acc.url}${url}`,
          }),
        );
      }),
    )
      .then((data: any[]) =>
        data.filter((d) => d.status === 'fulfilled').map((f) => f.value),
      )
      .then((data: AxiosResponse[]) => {
        const tempArr = data.reduce((acc: any[], current) => {
          return current.data ? acc.concat(Object.keys(current.data)) : acc;
        }, []);

        const dataKeys = tempArr.filter((item, pos) => {
          return tempArr.indexOf(item) == pos;
        });

        if (
          dataKeys.length > 0 ||
          url.includes('/schedules?startTime')
          // dataKeys[0] !== '0'
        ) {
          const listKey = dataKeys[0];
          const consolidatedData = data.reduce(
            (acc: AxiosResponse, current) => {
              const newData = { ...acc };

              const accUrl = new URL(newData?.config?.url || '').origin;
              const accAccount = accounts.find((a) => a.url === accUrl);

              const currUrl = new URL(current?.config?.url || '').origin;
              const currAccount = accounts.find((a) => a.url === currUrl);

              if (url.includes('/schedules?startTime')) {
                let schedules: any[] = newData.data.schedules.map((accEl) => ({
                  ...accEl,
                  prjacc: accEl.prjacc || accAccount,
                }));
                schedules = schedules.concat(
                  current.data.schedules.map((curEl) => ({
                    ...curEl,
                    prjacc: currAccount,
                  })),
                );
                let holidays: any[] = newData.data.holidays.map((accEl) => ({
                  ...accEl,
                  prjacc: accEl.prjacc || accAccount,
                }));
                holidays = holidays.concat(
                  current.data.holidays.map((curEl) => ({
                    ...curEl,
                    prjacc: currAccount,
                  })),
                );
                return { ...newData, data: { holidays, schedules } };
              } else if (dataKeys[0] === '0') {
                let dataArray: any[] = newData.data.map((accEl) => ({
                  ...accEl,
                  prjacc: accEl.prjacc || accAccount,
                }));

                dataArray = dataArray.concat(
                  current.data.map((curEl) => ({
                    ...curEl,
                    prjacc: currAccount,
                  })),
                );
                return { ...newData, data: dataArray };
              } else if (
                dataKeys.length === 1 &&
                data[0].data[dataKeys[0]].length !== undefined
              ) {
                let dataArray: any[] = newData.data[listKey].map((accEl) => ({
                  ...accEl,
                  prjacc: accEl.prjacc || accAccount,
                }));
                dataArray = dataArray.concat(
                  current.data[listKey].map((curEl) => ({
                    ...curEl,
                    prjacc: currAccount,
                  })),
                );
                return { ...newData, data: { [listKey]: dataArray } };
              } else if (url === '/global/dialerdefaults') {
                const dataArray = [{ ...newData.data, prjacc: accAccount }];
                dataArray.push({ ...newData.data, prjacc: currAccount });

                return { ...newData, data: dataArray };
              } else if (url === '/global') {
                let DialerDefaults: any[] = [
                  { ...newData.data.global.DialerDefaults, prjacc: accAccount },
                ];
                DialerDefaults.push({
                  ...newData.data.global.DialerDefaults,
                  rjacc: currAccount,
                });
                //TODO
                let Connect: any[] = [
                  { ...newData.data.global.Connect, prjacc: accAccount },
                ];
                //TODO
                Connect.push({
                  ...newData.data.global.Connect,
                  rjacc: currAccount,
                });
                //TODO
                return {
                  ...newData,
                  data: { global: { DialerDefaults, Connect } },
                };
              } else {
                const temp = newData.data || current.data;

                return { ...newData, data: temp };
              }
            },
          );
          return consolidatedData;
        } else if (url === '/global/dialerdefaults') {
          return data[0];
        } else {
          return { data: [] };
        }
      });
  } catch (error) {
    return await interceptorManager.applyRequestErrorInterceptors(error);
  }
}
// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => interceptorManager.applyRequestInterceptors(config),
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  },
);
axiosInstance.interceptors.response.use(
  (response) => interceptorManager.applyResponseInterceptors(response),
  (err) => interceptorManager.applyResponseErrorInterceptors(err),
);

export default {
  post,
  patch,
  get,
  put,
  deletE,
};
