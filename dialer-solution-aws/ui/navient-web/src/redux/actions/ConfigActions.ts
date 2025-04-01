import {
  getRegions,
  getContactFlowList as getContactFlows,
  set_account_override,
} from '@navient/common';
import { IAccounts } from '@navient/common/dist/src/components/commons/types/commonTypes';
import { GET_CONTACT_FLOWS } from './CampaignActions';

export const SET_SELECTED_ACCOUNT = 'SET_SELECTED_ACCOUNT'; 
export const GET_AWS_REGIONS = "GET_AWS_REGIONS";

export function getContactFlowList() {
  return {
    type: GET_CONTACT_FLOWS,
    payload: getContactFlows(),
  };
}

export function setProjectAccount(account: IAccounts | undefined | 'All') {
  set_account_override('0');
  if (account && account !== 'All') {
    sessionStorage.setItem('project_account', account.url);
    sessionStorage.setItem('config_account', account.url);
  } else {
    sessionStorage.setItem('project_account', `${account}`);
  }
  return {
    type: SET_SELECTED_ACCOUNT,
    payload: account,
  };
}

export function getAWSRegions() {
  return {
    type: GET_AWS_REGIONS,
    /** you can call api here */
    payload: getRegions(),
  };
}