import {
  deleteContactList,
  updateContactList,
  addContactList as _addContactList,
} from "@navient/common";
import { IContactList } from "@navient/common/dist/src/components/commons/types/contactListTypes";

export const DELETE_CONTACT_LIST = "DELETE_CONTACT_LIST";
export const UPDATE_CONTACT_LIST = "UPDATE_CONTACT_LIST";
export const ADD_CONTACT_LIST = "ADD_CONTACT_LIST";

export function deleteContactListByID(id: string) {
  return {
    type: DELETE_CONTACT_LIST,
    /** you can call api here */
    payload: deleteContactList(id),
  };
}

export function updateContactListByID(contactList: IContactList, id: string, selectedContactList: IContactList) {
  return {
    type: UPDATE_CONTACT_LIST,
    /** you can call api here */
    payload: updateContactList(contactList, id, selectedContactList),
  };
}

export function addContactList(contactList: IContactList) {
  return {
    type: ADD_CONTACT_LIST,
    /** you can call api here */
    payload: _addContactList(contactList),
  };
}
