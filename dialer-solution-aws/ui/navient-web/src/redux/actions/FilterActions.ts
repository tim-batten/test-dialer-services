import {
  validateFilter as _validateFilter,
  getFiltersList as getFilters,
  addFilter as _addFilter,
  deleteFilter,
  updateFilter,
} from "@navient/common";
import { IFilter } from "@navient/common/dist/src/components/commons/types/filterTypes";

export const GET_FILTERS = "GET_FILTERS";
export const ADD_FILTER = "ADD_FILTER";
export const DELETE_FILTER = "DELETE_FILTER";
export const UPDATE_FILTER = "UPDATE_FILTER";
export const VALIDATE_FILTER = "VALIDATE_FILTER";

export const getFiltersList = () => {
  return {
    type: GET_FILTERS,
    payload: getFilters(),
  };
};

export const addFilter = (filter: IFilter) => {
  return {
    type: ADD_FILTER,
    payload: _addFilter(filter),
  };
};

export const validateFilter = (filter: IFilter) => {
  return {
    type: VALIDATE_FILTER,
    payload: _validateFilter(filter),
  };
};

export function deleteFilterByID(id: string) {
  return {
    type: DELETE_FILTER,
    payload: deleteFilter(id),
  };
}

export function updateFilterByID(
  editedFilterConfig: IFilter,
  id: string,
  initialFilterConfig: IFilter
) {
  return {
    type: UPDATE_FILTER,
    payload: updateFilter(editedFilterConfig, id, initialFilterConfig),
  };
}
