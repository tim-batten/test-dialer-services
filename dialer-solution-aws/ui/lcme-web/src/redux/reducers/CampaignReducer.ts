import { get_config_account, isBaseURLAll } from '@lcme/common';
import {
  ADD_CAMPAIGN,
  ADD_GROUP,
  DELETE_CAMPAIGN,
  DELETE_GROUP,
  GET_CAMPAIGN_LIST,
  GET_PHONE_NUMBERS,
  UPDATE_CAMPAIGN,
  UPDATE_GROUP,
} from '../actions/CampaignActions';
import { GET_GROUPS } from '../actions/CampaignActions';
import { GET_QUEUES } from '../actions/CampaignActions';
import { GET_CONTACT_LISTS } from '../actions/CampaignActions';
import { GET_CONTACT_FLOWS } from '../actions/CampaignActions';
import { GET_ONE_CONTACT_LIST } from '../actions/CampaignActions';
import { ConnectQueueInfo } from '@lcme/common/dist/src/types/connect-queue';
import { ContactFlowInfo } from '@lcme/common/dist/src/types/connect-contact-flow';
import { ICampaign } from '@lcme/common/dist/src/components/commons/types/campaignTypes';
import { ConnectPhoneNumberInfo } from '@lcme/common/dist/src/types/connect-phone-number';
import { IContactList } from '@lcme/common/dist/src/components/commons/types/contactListTypes';
import { PhoneNumberApiResponse, PhoneNumberInfo } from 'lcme-common/lib/types/phone-numbers';

export interface CampaignState {
  campaigns: ICampaign[];
  campaignDeps: {};
  didSucceed: boolean;
  groups: any[];
  queues: ConnectQueueInfo[];
  contactLists: any[];
  contactFlows: ContactFlowInfo[];
  availableCallerIDs: PhoneNumberInfo[];
  contactList: IContactList[];
}

const initialState: CampaignState = {
  campaigns: [],
  campaignDeps: {},
  didSucceed: false,
  groups: [],
  queues: [],
  contactLists: [],
  availableCallerIDs: [],
  contactFlows: [],
  contactList: [],
};

export default function reduce(state = initialState, action) {
  switch (action.type) {
    case `${GET_CAMPAIGN_LIST}_FULFILLED`:
      state = {
        ...state,
        campaigns: action.payload.data.campaigns,
        campaignDeps: action.payload.data,
      };
      break;
    case `${GET_CAMPAIGN_LIST}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${GET_GROUPS}_FULFILLED`:
      state = {
        ...state,
        groups: action.payload.data.campaign_groups,
      };
      break;
    case `${GET_GROUPS}_REJECTED`:
      state = {
        ...state,
      };
      break;
    case `${ADD_GROUP}_FULFILLED`:
      const temp_groups = [...state.groups];
      temp_groups.push(action.payload.data.campaign_group);

      state = {
        ...state,
        groups: temp_groups,
      };
      break;
    case `${ADD_GROUP}_REJECTED`:
      state = {
        ...state,
      };
      break;
    case `${UPDATE_GROUP}_FULFILLED`:
      const _data = action.payload.data.campaign_group;
      const _id = action.payload.data.id;
      const _copy = state.groups.find((c) => c.id === _id);
      const _index = state.groups.indexOf(_copy);
      const groups = [...state.groups];
      let temp_group_data = _data;

      if (isBaseURLAll()) {
        temp_group_data = { ...temp_group_data, prjacc: get_config_account() };
      }
      groups.splice(_index, 1, temp_group_data);

      state = {
        ...state,
        groups: groups,
      };
      break;
    case `${UPDATE_GROUP}_REJECTED`:
      state = {
        ...state,
      };
      break;
    case `${DELETE_GROUP}_FULFILLED`:
      state = {
        ...state,
        groups: state.groups.filter((c) => c.id !== action.payload),
      };
      break;
    case `${DELETE_GROUP}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${GET_QUEUES}_FULFILLED`:
      state = {
        ...state,
        queues: action.payload.data,
      };
      break;
    case `${GET_QUEUES}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${GET_CONTACT_LISTS}_FULFILLED`:
      state = {
        ...state,
        contactLists: action.payload.data.contactlists,
      };
      break;

    case `${GET_CONTACT_LISTS}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${GET_CONTACT_FLOWS}_FULFILLED`:
      state = {
        ...state,
        contactFlows: action.payload.data,
      };
      break;
    case `${GET_CONTACT_FLOWS}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${GET_PHONE_NUMBERS}_FULFILLED`:
      const payloadResponse = action.payload.data as PhoneNumberApiResponse;
      state = {
        ...state,
        availableCallerIDs: payloadResponse.phoneNumbers,
      };
      break;
    case `${GET_PHONE_NUMBERS}_REJECTED`:
      state = {
        ...state,
      };
      break;
    case `${DELETE_CAMPAIGN}_FULFILLED`:
      state = {
        ...state,
        campaigns: state.campaigns.filter((c) => c.id !== action.payload),
        didSucceed: true,
      };
      break;
    case `${DELETE_CAMPAIGN}_REJECTED`:
      state = {
        ...state,
        didSucceed: false,
      };
      break;
    case `${UPDATE_CAMPAIGN}_FULFILLED`:
      const data = action.payload.data.campaign;
      const id = action.payload.data.campaign.id;
      const copy = state.campaigns.find((c) => c.id === id);
      const index = copy ? state.campaigns.indexOf(copy) : -1;
      const campaigns = [...state.campaigns];
      let temp_data = data;

      if (isBaseURLAll()) {
        temp_data = { ...temp_data, prjacc: get_config_account() };
      }
      campaigns.splice(index, 1, temp_data);

      state = {
        ...state,
        campaigns: campaigns,
        didSucceed: true,
      };
      break;

    case `${UPDATE_CAMPAIGN}_REJECTED`:
      state = {
        ...state,
        didSucceed: false,
      };
      break;
    case `${ADD_CAMPAIGN}_FULFILLED`:
      const temp_campaigns = [...state.campaigns];
      let temp_campaign = action.payload.data.campaign;

      if (isBaseURLAll()) {
        temp_campaign = { ...temp_campaign, prjacc: get_config_account() };
      }
      temp_campaigns.push(temp_campaign);

      state = {
        ...state,
        campaigns: temp_campaigns,
        didSucceed: true,
      };
      break;
    case `${ADD_CAMPAIGN}_REJECTED`:
      state = {
        ...state,
        didSucceed: false,
      };
      break;

    case `${GET_ONE_CONTACT_LIST}_FULFILLED`:
      state = {
        ...state,
        contactList: action.payload.data.contactlist,
        didSucceed: true,
      };
      break;
    case `${GET_ONE_CONTACT_LIST}_REJECTED`:
      state = {
        ...state,
        didSucceed: false,
      };
      break;

    default:
      break;
  }

  return state;
}
