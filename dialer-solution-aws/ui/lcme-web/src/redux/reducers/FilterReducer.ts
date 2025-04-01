import { get_config_account, isBaseURLAll } from '@lcme/common';
import {
  GET_FILTERS,
  ADD_FILTER,
  DELETE_FILTER,
  UPDATE_FILTER,
  VALIDATE_FILTER,
} from '../actions/FilterActions';

interface FilterState {
  filters: any[];
  didSucceed: boolean;
  returnedRecords: {
    timestamp: string;
    returnedRecords: any;
  };
}

const initialState: FilterState = {
  filters: [],
  didSucceed: false,
  returnedRecords: {
    timestamp: new Date().toISOString(),
    returnedRecords: -1,
  },
};

export default function reduce(state = initialState, action) {
  switch (action.type) {
    case `${GET_FILTERS}_FULFILLED`:
      state = {
        ...state,
        filters: action.payload.data.filters,
      };
      break;

    case `${GET_FILTERS}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${ADD_FILTER}_FULFILLED`:
      const temp_filters = [...state.filters];

      let temp_filter = action.payload.data.filter;

      if (isBaseURLAll()) {
        temp_filter = { ...temp_filter, prjacc: get_config_account() };
      }
      temp_filters.push(temp_filter);

      state = {
        ...state,
        filters: temp_filters,
        didSucceed: true,
      };
      break;

    case `${ADD_FILTER}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${DELETE_FILTER}_FULFILLED`:
      state = {
        ...state,
        filters: state.filters.filter((f) => f.id !== action.payload),
      };
      break;

    case `${DELETE_FILTER}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${UPDATE_FILTER}_FULFILLED`:
      const data = action.payload.data.filter;
      const id = action.payload.data.filter.id;
      const copy = state.filters.find((f) => f.id === id);
      const index = state.filters.indexOf(copy);
      const filters = [...state.filters];
      let temp_data = data;

      if (isBaseURLAll()) {
        temp_data = { ...temp_data, prjacc: get_config_account() };
      }
      filters.splice(index, 1, temp_data);

      state = {
        ...state,
        filters: filters,
      };
      break;

    case `${UPDATE_FILTER}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${VALIDATE_FILTER}_FULFILLED`:
      state = {
        ...state,
        returnedRecords: {
          timestamp: new Date().toISOString(),
          returnedRecords: action.payload.data[0],
        },
      };
      break;

    case `${VALIDATE_FILTER}_REJECTED`:
      const responseData =
        action.payload &&
        action.payload.response &&
        action.payload.response.data;
      const networkError = responseData && action.payload.response.data.message;
      const sqlError =
        responseData &&
        action.payload.response.data[0] &&
        action.payload.response.data[0].statusMessage;
      const defaultError =
        'Error while validating filters; check dev console for error message.';

      state = {
        ...state,
        returnedRecords: {
          timestamp: new Date().toISOString(),
          returnedRecords: {
            statusMessage: networkError
              ? networkError
              : sqlError
              ? sqlError
              : defaultError,
          },
        },
      };
      break;

    default:
      break;
  }
  return state;
}
