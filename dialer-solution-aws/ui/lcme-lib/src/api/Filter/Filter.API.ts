import { get, post, patch, deletE } from '../utils';
import { IFilter } from '../../components/commons/types/filterTypes';
import { If } from 'yup/lib/util/types';
import hash from 'object-hash';

export const getFiltersList = async () => {
  const payload = {
    params: {},
  };

  return await get('/filters/all', payload);
};

export const validateMultipleFilter = async (payload) => {

  return await post('/filters/validate/multi-filter', payload);
};

export const addFilter = async (filter: IFilter) => {
  const payload = filter;
  return await post(`filters`, payload);
};

export const validateFilter = async (filter: IFilter) => {
  const payload = filter;
  return await post(`/filters/validate`, payload);
};

export const deleteFilter = async (id: string) => {
  const payload = {
    params: {},
  };
  await deletE(`filters/${id}`, payload);
  return id;
};

export const updateFilter = async (
  editedFilterConfig: IFilter,
  id: string,
  initialFilterConfig: IFilter,
) => {
  const payload = editedFilterConfig;
  const temp = JSON.parse(JSON.stringify(initialFilterConfig));

  delete temp['prjacc'];
  delete temp['tableData'];
  const initialConfigHash = hash(JSON.stringify(temp));
  const headers = {
    'initial-entity-hash': initialConfigHash,
  };

  return {
    data: await (await patch(`filters/${id}`, payload, { headers })).data,
    id: id,
  };
};
