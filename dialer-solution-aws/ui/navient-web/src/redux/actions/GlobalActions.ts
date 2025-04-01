import {
  getDialerDefaults as getDefaults,
  getGlobalConfig as getGlobal,
  updateGlobalConfig as updateGlobal,
} from '@navient/common';
import { IGlobalConfig } from '@navient/common/dist/src/components/commons/types/globalTypes';

export const GET_GLOBAL_CONFIG = 'GET_GLOBAL_CONFIG';
export const UPDATE_GLOBAL_CONFIG = 'UPDATE_GLOBAL_CONFIG';
export const GET_GLOBAL_DIALER = 'GET_GLOBAL_DIALER';

// This is what gets the dialer defaults for form validation
export function getDialerDefaults() {
  return {
    type: GET_GLOBAL_DIALER,
    payload: getDefaults(),
  };
}

// This is what gets the current Config UI admin object for editing
export function getGlobalConfig() {
  return {
    type: GET_GLOBAL_CONFIG,
    payload: getGlobal(),
  };
}

export function updateGlobalConfig(global: any, initialGlobalConfig: IGlobalConfig) {
  return {
    type: UPDATE_GLOBAL_CONFIG,
    payload: updateGlobal(global, initialGlobalConfig),
  };
}

