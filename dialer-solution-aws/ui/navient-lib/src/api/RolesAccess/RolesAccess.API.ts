import { AxiosResponse } from 'axios';
import { get, deletE, patch, post } from '../utils';
import { RolesApiResponse } from 'navient-common/lib/types/roles';

export const getRoles = async () => {
  const payload = {
    params: {},
  };
  return (await get('/auth/roles', payload)) as AxiosResponse<RolesApiResponse>;
};
