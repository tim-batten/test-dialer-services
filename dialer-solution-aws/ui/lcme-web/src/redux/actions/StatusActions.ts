import { getApiStatus } from '@lcme/common/dist/src/api/ApiStatus/ApiStatus.API';

export const GET_API_STATUS = 'GET_API_STATUS';

export const getApiStatusAction = () => {
  return {
    type: GET_API_STATUS,
    payload: getApiStatus(),
  };
};
