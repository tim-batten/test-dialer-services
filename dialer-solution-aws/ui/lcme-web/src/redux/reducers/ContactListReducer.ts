import {
  ADD_CONTACT_LIST,
  DELETE_CONTACT_LIST,
  UPDATE_CONTACT_LIST,
} from "../actions/ContactListActions";
import { GET_CONTACT_LISTS } from "../actions/CampaignActions";
import { get_config_account, isBaseURLAll } from "@lcme/common";

export interface ContactListState {
  contactLists: any[];
  didSucceed: boolean;
}

const initialState: ContactListState = {
  contactLists: [],
  didSucceed: false,
};

export default function reduce(state = initialState, action) {
  switch (action.type) {
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

    case `${DELETE_CONTACT_LIST}_FULFILLED`:
      state = {
        ...state,
        contactLists: state.contactLists.filter((c) => c.id !== action.payload),
        didSucceed: true,
      };
      break;
    case `${DELETE_CONTACT_LIST}_REJECTED`:
      state = {
        ...state,
        didSucceed: false,
      };
      break;
    case `${UPDATE_CONTACT_LIST}_FULFILLED`:
      const data = action.payload.data.contactlist;
      const id = action.payload.data.contactlist.id;
      const copy = state.contactLists.find((c) => c.id === id);
      const index = state.contactLists.indexOf(copy);
      const contactLists = [...state.contactLists];
      let temp_data = data;

      if (isBaseURLAll()) {
        temp_data = { ...temp_data, prjacc: get_config_account() };
      }
      contactLists.splice(index, 1, temp_data);

      state = {
        ...state,
        contactLists: contactLists,
        didSucceed: true,
      };
      break;
    case `${UPDATE_CONTACT_LIST}_REJECTED`:
      state = {
        ...state,
        didSucceed: false,
      };
      break;
    case `${ADD_CONTACT_LIST}_FULFILLED`:
      const temp_contactLists = [...state.contactLists];
      let temp_contact = action.payload.data.contactlist;

      if (isBaseURLAll()) {
        temp_contact = { ...temp_contact, prjacc: get_config_account() };
      }
      temp_contactLists.push(temp_contact);

      state = {
        ...state,
        contactLists: temp_contactLists,
        didSucceed: true,
      };
      break;
    case `${ADD_CONTACT_LIST}_REJECTED`:
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
