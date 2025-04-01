import {
  addCampaign as _addCampaign,
  addGroup as _addGroup,
  deleteCampaign,
  deleteGroup,
  getCampaignList as getCampaign,
  getContactListList as getContactList,
  getGroupList as getGroup,
  getContactList as getOneContactList,
  getPhoneNumberList as getPhoneNumbers,
  getQueueList as getQueue,
  getContactFlowList as getContactFlows,
  updateCampaign,
  updateGroup
} from "@navient/common";
import {
  ICampaign,
  ICampaignGroup,
} from "@navient/common/dist/src/components/commons/types/campaignTypes";
export const GET_CAMPAIGN_LIST = "GET_CAMPAIGN_LIST";
export const DELETE_CAMPAIGN = "DELETE_CAMPAIGN";
export const UPDATE_CAMPAIGN = "UPDATE_CAMPAIGN";
export const ADD_CAMPAIGN = "ADD_CAMPAIGN";
export const GET_GROUPS = "GET_GROUPS";
export const ADD_GROUP = "ADD_GROUP";
export const DELETE_GROUP = "DELETE_GROUP";
export const UPDATE_GROUP = "UPDATE_GROUP";
export const GET_QUEUES = 'GET_QUEUES';
export const GET_PHONE_NUMBERS = 'GET_PHONE_NUMBERS';
export const GET_CONTACT_LISTS = "GET_CONTACT_LISTS";
export const GET_CONTACT_FLOWS = "GET_CONTACT_FLOWS";
export const GET_ONE_CONTACT_LIST = "GET_ONE_CONTACT_LIST";

export function getCampaignList() {
  return {
    type: GET_CAMPAIGN_LIST,
    /** you can call api here */
    payload: getCampaign(),
  };
}

export function deleteCampaignByID(id: string, cascade: boolean) {
  return {
    type: DELETE_CAMPAIGN,
    /** you can call api here */
    payload: deleteCampaign(id, cascade),
  };
}

export function updateCampaignByID(
  editedCampaignConfig: ICampaign,
  id: string,
  initialCampaignConfig: ICampaign
) {
  return {
    type: UPDATE_CAMPAIGN,
    /** you can call api here */
    payload: updateCampaign(editedCampaignConfig, id, initialCampaignConfig),
  };
}

export function addCampaign(campaign: ICampaign) {
  return {
    type: ADD_CAMPAIGN,
    /** you can call api here */
    payload: _addCampaign(campaign),
  };
}

export function getGroupList() {
  return {
    type: GET_GROUPS,
    /** you can call api here */
    payload: getGroup(),
  };
}
export function addGroup(group: ICampaignGroup) {
  return {
    type: ADD_GROUP,
    /** you can call api here */
    payload: _addGroup(group),
  };
}
export function updateGroupByID(
  group: ICampaignGroup,
  id: string,
  initialGroup: any
) {
  return {
    type: UPDATE_GROUP,
    /** you can call api here */
    payload: updateGroup(group, id, initialGroup),
  };
}
export function deleteGroupByID(id: string) {
  return {
    type: DELETE_GROUP,
    /** you can call api here */
    payload: deleteGroup(id),
  };
}

export function getQueueList() {
  return {
    type: GET_QUEUES,
    payload: getQueue(),
  };
}

export function getPhoneNumberList() {
  return {
    type: GET_PHONE_NUMBERS,
    payload: getPhoneNumbers(),
  };
}

export function getContactListList() {
  return {
    type: GET_CONTACT_LISTS,
    payload: getContactList(),
  };
}

export function getContactFlowList() {
  return {
    type: GET_CONTACT_FLOWS,
    payload: getContactFlows(),
  };
}

export function getAContactList(contactListID: string) {
  return {
    type: GET_ONE_CONTACT_LIST,
    payload: getOneContactList(contactListID),
  };
}
