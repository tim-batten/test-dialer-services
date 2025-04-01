import { IContactList } from '../../components/commons/types/contactListTypes';
import { deletE, patch, post } from '../utils';
import hash from 'object-hash';

export const deleteContactList = async (id: string) => {
  const payload = {
    params: {},
  };
  await deletE(`contactlists/${id}`, payload);
  return id;
};

export const updateContactList = async (
  editedContactListConfig: IContactList,
  id: string,
  initialContactListConfig: IContactList,
) => {
  const temp = JSON.parse(JSON.stringify(initialContactListConfig));
  delete temp['prjacc'];
  delete temp['tableData'];
  const payload = editedContactListConfig;
  const initialConfigHash = hash(JSON.stringify(temp));
  const headers = {
    'initial-entity-hash': initialConfigHash,
  };

  return {
    data: await (await patch(`contactlists/${id}`, payload, { headers })).data,
    id: id,
  };
};

export const addContactList = async (contactList: IContactList) => {
  const payload = contactList;

  return await post(`contactlists`, payload);
};
