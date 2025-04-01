import { AccessRoles, CampaignMainView } from "@lcme/common";
import {
  ICampaign,
  ICampaignGroup,
} from "@lcme/common/dist/src/components/commons/types/campaignTypes";
import { IAccounts } from "@lcme/common/dist/src/components/commons/types/commonTypes";
import { Component } from "react";
import { ConnectQueueInfo } from "@lcme/common/dist/src/types/connect-queue";
import { ContactFlowInfo } from "@lcme/common/dist/src/types/connect-contact-flow";
import { IContactList } from '@lcme/common/dist/src/components/commons/types/contactListTypes';
import { IDialerDefaults } from '@lcme/common/dist/src/components/commons/types/globalTypes';
import { PhoneNumberInfo } from 'lcme-common/lib/types/phone-numbers';

interface Props {
  campaigns: ICampaign[];
  campaignDeps: any;
  selectedAccount: IAccounts | undefined | 'All';
  campaignGroups: any[];
  didSucceed: boolean;
  queues: ConnectQueueInfo[];
  contactLists: IContactList[];
  availableCallerIDs: PhoneNumberInfo[];
  contactFlows: ContactFlowInfo[];
  contactList: IContactList[];
  dialerDefaults: IDialerDefaults;
  accessLevel: AccessRoles;
  setAccount: (account_name: IAccounts | undefined | 'All') => void;
  getCampaigns: () => void;
  getGroups: () => void;
  getQueues: () => void;
  getContactLists: () => void;
  getAvailableCallerIDs: () => void;
  getContactFlowList: () => void;
  deleteCampaignByID: (id: string, cascade: boolean) => Promise<any>;
  updateCampaignByID: (editedCampaignConfig: ICampaign, id: string, initialCampaignConfig: ICampaign) => Promise<any>;
  addCampaign: (campaign: ICampaign) => Promise<any>;
  addGroup: (group: any) => Promise<any>;
  updateGroup: (group: ICampaignGroup, id: string, initialGroup: any) => Promise<any>;

  getOneContactList: (contactListID: string) => void;
  getDialerDefaults: () => void;
  deleteGroupByID: (id: string) => Promise<any>;
}
interface State {}

export class CampaignView extends Component<Props, State> {
  state = {};
  handleCampaignUpdate = (
    editedCampaignConfig: ICampaign,
    id: string,
    callback: (info: any) => void,
    initialCampaignConfig: ICampaign
  ) => {
    this.props
      .updateCampaignByID(editedCampaignConfig, id, initialCampaignConfig)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" }, errorMessage: error.message });
      });
  };

  handleCampaignAdd = (campaign: ICampaign, callback: (info: any) => void) => {
    this.props
      .addCampaign(campaign)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" } });
      });
  };
  handleGroupAdd = (group: ICampaignGroup, callback: (info: any) => void) => {
    this.props
      .addGroup(group)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" } });
      });
  };

  handleGroupUpdate = (
    group: ICampaignGroup,
    id: string,
    callback: (info: any) => void,
    initialGroup: any
  ) => {
    this.props
      .updateGroup(group, id, initialGroup)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" }, errorMessage: error.message });
      });
  };

  handleCampaignDelete = (
    id,
    cascade: boolean,
    callback: (info: any) => void
  ) => {
    this.props
      .deleteCampaignByID(id, cascade)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" }, response: error.response });
      });
  };

  handleGroupÎDelete = (id, callback: (info: any) => void) => {
    this.props
      .deleteGroupByID(id)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({
          action: { type: "error" },
          response: { ...error.response, id },
        });
      });
  };

  render() {
    return (
      <CampaignMainView
        campaigns={this.props.campaigns}
        campaignDeps={this.props.campaignDeps}
        campaignGroups={this.props.campaignGroups}
        queues={this.props.queues}
        contactLists={this.props.contactLists}
        availableCallerIDs={this.props.availableCallerIDs}
        contactFlows={this.props.contactFlows}
        contactList={this.props.contactList}
        dialerDefaults={this.props.dialerDefaults}
        getCampaigns={() => this.props.getCampaigns()}
        getGroups={() => this.props.getGroups()}
        getQueues={() => this.props.getQueues()}
        getContactLists={() => this.props.getContactLists()}
        getAvailableCallerIDs={() => this.props.getAvailableCallerIDs()}
        getContactFlowList={() => this.props.getContactFlowList()}
        getDialerDefaults={() => this.props.getDialerDefaults()}
        deleteCampaignByID={(
          id,
          cascade: boolean,
          callback: (info: any) => void
        ) => this.handleCampaignDelete(id, cascade, callback)}
        updateCampaignByID={(
          editedCampaignConfig: ICampaign,
          id: string,
          callback: (info: any) => void,
          initialCampaignConfig: ICampaign
        ) =>
          this.handleCampaignUpdate(
            editedCampaignConfig,
            id,
            callback,
            initialCampaignConfig
          )
        }
        addCampaign={(campaign: ICampaign, callback: (info: any) => void) =>
          this.handleCampaignAdd(campaign, callback)
        }
        addGroup={(group: ICampaignGroup, callback: (info: any) => void) =>
          this.handleGroupAdd(group, callback)
        }
        updateGroup={(
          group: ICampaignGroup,
          id: string,
          callback: (info: any) => void,
          initialGroup: any
        ) => this.handleGroupUpdate(group, id, callback, initialGroup)}
        deleteGroupByID={(id: string, callback: (info: any) => void) =>
          this.handleGroupÎDelete(id, callback)
        }
        getOneContactList={(contactListID: string) =>
          this.props.getOneContactList(contactListID)
        }
        accessLevel={this.props.accessLevel}
        selectedAccount={this.props.selectedAccount}
        setAccount={(account: IAccounts | undefined | "All") =>
          this.props.setAccount(account)
        }
      />
    );
  }
}

export default CampaignView;
