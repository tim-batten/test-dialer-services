import { IAccounts } from '@lcme/common/dist/src/components/commons/types/commonTypes';
import { accounts } from '@lcme/common/dist/src/frontend-config';
import { SET_SELECTED_ACCOUNT, GET_AWS_REGIONS } from '../actions/ConfigActions';
import { GET_CONTACT_FLOWS } from '../actions/CampaignActions';
import { ContactFlowInfo } from '@lcme/common/dist/src/types/connect-contact-flow';

export interface ConfigState {
  awsRegions: string[];
  contactFlows: ContactFlowInfo[];
  selectedAccount: IAccounts | undefined | 'All';
}

const initialState: ConfigState = {
  contactFlows: [],
  awsRegions: [],
  selectedAccount: accounts[0],
};

export default function reduce(state = initialState, action) {
  switch (action.type) {
    case `${SET_SELECTED_ACCOUNT}`:
      state = {
        ...state,
        selectedAccount: action.payload,
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
      case `${GET_AWS_REGIONS}_FULFILLED`:
        state = {
          ...state,
          awsRegions: action.payload.data, //TODO
        };
        break;
  
      case `${GET_AWS_REGIONS}_UNFULFILLED`:
        state = {
          ...state,
        };
        break;
  
      case `${GET_AWS_REGIONS}_REJECTED`:
        state = {
          ...state,
        };
        break;
  
    default:
      break;
  }

  return state;
}
