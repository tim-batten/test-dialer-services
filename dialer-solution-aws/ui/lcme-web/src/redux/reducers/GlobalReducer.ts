import {
  GET_GLOBAL_CONFIG,
  GET_GLOBAL_DIALER,
  UPDATE_GLOBAL_CONFIG,
} from '../actions/GlobalActions';

import {
  ConnectInitialValues,
  dialerDefaultsConfigInitialValues,
} from '@lcme/common/dist/src/components/commons/assets/InitialValues';
import { IConnect, IDialerDefaults, IGlobalConfig } from '@lcme/common/dist/src/components/commons/types/globalTypes';

export interface GlobalState {
  connectConfig: IConnect;
  dialerDefaultsConfig: IDialerDefaults;
  initialGlobalConfig?: IGlobalConfig;
}

const initialState: GlobalState = {
  connectConfig: ConnectInitialValues,
  dialerDefaultsConfig: dialerDefaultsConfigInitialValues,
  initialGlobalConfig: undefined
};

export default function reduce(state = initialState, action) {
  switch (action.type) {
    case `${GET_GLOBAL_DIALER}_FULFILLED`:
      state = {
        ...state,
        dialerDefaultsConfig: action.payload.data,
      };
      break;

    case `${GET_GLOBAL_DIALER}_UNFULFILLED`:
      state = {
        ...state,
      };
      break;

    case `${GET_GLOBAL_CONFIG}_FULFILLED`:
      state = {
        ...state,
        connectConfig: action.payload.data.global.Connect,
        dialerDefaultsConfig: action.payload.data.global.DialerDefaults,
        initialGlobalConfig: action.payload.data.global
      };
      break;

    case `${GET_GLOBAL_CONFIG}_UNFULFILLED`:
      state = {
        ...state,
      };
      break;

    case `${UPDATE_GLOBAL_CONFIG}_FULFILLED`:
      state = {
        ...state,
        connectConfig: action.payload.data.global.Connect,
        dialerDefaultsConfig: action.payload.data.global.DialerDefaults,
        initialGlobalConfig: action.payload.data.global
      };
      break;

    case `${UPDATE_GLOBAL_CONFIG}_UNFULFILLED`:
      state = {
        ...state,
      };
      break;

    case `${UPDATE_GLOBAL_CONFIG}_REJECTED`:
      state = {
        ...state,
      };
      break;

    default:
      break;
  }

  return state;
}
