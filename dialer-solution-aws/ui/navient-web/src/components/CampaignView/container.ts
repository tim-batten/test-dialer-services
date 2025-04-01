import {
  ICampaign,
  ICampaignGroup,
} from "@navient/common/dist/src/components/commons/types/campaignTypes";
import { IAccounts } from "@navient/common/dist/src/components/commons/types/commonTypes";
import { connect } from "react-redux";
import {
  addCampaign,
  addGroup,
  deleteCampaignByID,
  deleteGroupByID,
  getAContactList,
  getCampaignList,
  getContactListList,
  getGroupList,
  getContactFlowList,
  getQueueList,
  updateCampaignByID,
  updateGroupByID,
  getPhoneNumberList,
} from "../../redux/actions/CampaignActions";
import { setProjectAccount } from "../../redux/actions/ConfigActions";
import { getDialerDefaults } from "../../redux/actions/GlobalActions";
import Component from "./CampaignView";
import { RootState } from '../../redux/store';

const mapStateToProps = (state: RootState) => {
  return {
    campaigns: state.campaign.campaigns,
    campaignDeps: state.campaign.campaignDeps,
    campaignGroups: state.campaign.groups,
    didSucceed: state.campaign.didSucceed,
    queues: state.campaign.queues,
    contactLists: state.campaign.contactLists,
    availableCallerIDs: state.campaign.availableCallerIDs,
    contactFlows: state.campaign.contactFlows,
    contactList: state.campaign.contactList,
    dialerDefaults: state.global.dialerDefaultsConfig,
    accessLevel: state.rolesAccess.role,
    selectedAccount: state.config.selectedAccount,
  };
};


const mapDispatchToProps = (dispatch: any, state: any) => ({
  getCampaigns: () => dispatch(getCampaignList()),
  setAccount: (account_name: IAccounts | undefined | "All") =>
    dispatch(setProjectAccount(account_name)),
  getGroups: () => dispatch(getGroupList()),
  getQueues: () => dispatch(getQueueList()),
  getContactLists: () => dispatch(getContactListList()),
  getAvailableCallerIDs: () => dispatch(getPhoneNumberList()),
  getContactFlowList: () => dispatch(getContactFlowList()),
  getOneContactList: (contactListID: string) =>
    dispatch(getAContactList(contactListID)),
  getDialerDefaults: () => dispatch(getDialerDefaults()),
  deleteCampaignByID: (id: string, cascade: boolean) =>
    dispatch(deleteCampaignByID(id, cascade)),
  updateCampaignByID: (
    editedCampaignConfig: ICampaign,
    id: string,
    initialCampaignConfig: ICampaign
  ) =>
    dispatch(
      updateCampaignByID(editedCampaignConfig, id, initialCampaignConfig)
    ),
  addCampaign: (campaign: ICampaign) => dispatch(addCampaign(campaign)),
  addGroup: (group: ICampaignGroup) => dispatch(addGroup(group)),
  updateGroup: (group: ICampaignGroup, id: string, initialGroup: any) =>
    dispatch(updateGroupByID(group, id, initialGroup)),
  deleteGroupByID: (id: string) => dispatch(deleteGroupByID(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);