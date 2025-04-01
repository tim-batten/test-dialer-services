import { AxiosResponse } from 'axios';
import {
  ICampaign,
  ICampaignGroup,
} from '../../components/commons/types/campaignTypes';
import { get, deletE, patch, post } from '../utils';
import hash from 'object-hash';
import { ContactFlowInfo } from '../../types/connect-contact-flow';
import { ConnectQueueInfo } from '../../types/connect-queue';
import { PhoneNumberApiResponse } from 'navient-common/lib/types/phone-numbers';

export const getCampaignList = async () => {
  const payload = {
    params: {},
  };

  return await get('/campaigns/all', payload);
};

export const getOneCampaign = async (selectedCampaignID: string) => {
  const payload = {
    params: {},
  };

  const campaignID = selectedCampaignID;

  return await get(`/campaigns/${campaignID}`, payload);
};

export const deleteCampaign = async (id: string, cascade: boolean) => {
  const payload = {
    params: {},
  };
  // await new Promise((resolve, reject) => {
  //   deletE(`campaigns/${id}`, payload)
  //     .then((data) => {
  //       resolve(data);
  //     })
  //     .catch((err) => {
  //       const response = err.response;
  //       if (response.status === 409) {
  //         resolve(deleteCampaign(`${id}?cascade=true`));
  //       } else {
  //         return reject(err);
  //       }
  //     });
  // });
  if (cascade) {
    await deletE(`campaigns/${id}?cascade=true`, payload);
  } else {
    await deletE(`campaigns/${id}`, payload);
  }
  return id;
};

export const updateCampaign = async (
  editedCampaignConfig: ICampaign,
  id: string,
  initialCampaignConfig: ICampaign,
) => {
  const temp = JSON.parse(JSON.stringify(initialCampaignConfig));
  delete temp['prjacc'];
  delete temp['tableData'];
  const payload = editedCampaignConfig;
  const initialConfigHash = hash(JSON.stringify(temp));
  const headers = {
    'initial-entity-hash': initialConfigHash,
  };

  return {
    data: await (await patch(`campaigns/${id}`, payload, { headers })).data,
    id: id,
  };
};

export const addCampaign = async (campaign: ICampaign) => {
  const payload = campaign;

  return await post(`campaigns`, payload);
};

export const getGroupList = async () => {
  const payload = {
    params: {},
  };

  return await get('/campaign_groups/all', payload);
};

export const addGroup = async (group: ICampaignGroup) => {
  // const payload = { campaign_groups: group };

  return await post(`campaign_groups`, group);
};

export const updateGroup = async (
  group: ICampaignGroup,
  id: string,
  initialGroup: any,
) => {
  const temp = JSON.parse(JSON.stringify(initialGroup));
  delete temp['prjacc'];
  const payload = { ...group, id };
  const initialConfigHash = hash(JSON.stringify(temp));
  const headers = {
    'initial-entity-hash': initialConfigHash,
  };
  return {
    data: await (
      await patch(`campaign_groups/${id}`, payload, { headers })
    ).data,
    id: id,
  };
};
//TODO
export const deleteGroup = async (id: string) => {
  const payload = {
    params: {},
  };
  await deletE(`campaign_groups/${id}`, payload);
  return id;
};

export const getQueueList = async () => {
  const payload = {
    params: {},
  };

  return await get('/connect/queues?queueTypes=STANDARD', payload) as AxiosResponse<{ queues: ConnectQueueInfo[] }>;
};

export const getPhoneNumberList = async () => {
  const payload = {
    params: {},
  };

  return await get('/connect/phone-numbers', payload) as AxiosResponse<{ phoneNumbers: PhoneNumberApiResponse[] }>;
}

export const getContactListList = async () => {
  const payload = {
    params: {},
  };

  return await get('/contactlists/all', payload);
};

export const getContactFlowList = async () => {
  const payload = {
    params: {},
  };

  return await get('/connect/contact-flows?flowTypes=CONTACT_FLOW', payload) as AxiosResponse<{ contactFlows: ContactFlowInfo[] }>;
};

export const getContactList = async (selectedContactListID: string) => {
  const payload = {
    params: {},
  };

  const contactListID = selectedContactListID;

  return await get(`/contactlists/${contactListID}`, payload);
};
