import { IAccounts } from "@navient/common/dist/src/components/commons/types/commonTypes";
import { IContactList } from "@navient/common/dist/src/components/commons/types/contactListTypes";
import { connect } from "react-redux";
import { getContactListList } from "../../redux/actions/CampaignActions";
import { setProjectAccount } from "../../redux/actions/ConfigActions";
import {
  addContactList,
  deleteContactListByID,
  updateContactListByID,
} from "../../redux/actions/ContactListActions";
import {
  getDialerDefaults
} from "../../redux/actions/GlobalActions";
import ContactListView from "./ContactListView";
import { RootState } from '../../redux/store';

const mapStateToProps = (state: RootState) => ({
  dialerDefaults: state.global.dialerDefaultsConfig,
  contactLists: state.contactList.contactLists,
  accessLevel: state.rolesAccess.role,
  selectedAccount: state.config.selectedAccount,
});

const mapDispatchToProps = (dispatch: any, state: any) => ({
  setAccount: (account_name: IAccounts | undefined | "All") =>
    dispatch(setProjectAccount(account_name)),
  getContactLists: () => dispatch(getContactListList()),
  getDialerDefaults: () => dispatch(getDialerDefaults()),
  deleteContactListByID: (id: string) => dispatch(deleteContactListByID(id)),
  updateContactListByID: (
    editedContactListConfig: IContactList,
    id: string,
    initialContactListConfig: IContactList
  ) =>
    dispatch(
      updateContactListByID(
        editedContactListConfig,
        id,
        initialContactListConfig
      )
    ),
  addContactList: (contactList: IContactList) =>
    dispatch(addContactList(contactList)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ContactListView);
