import {
  AccessRoles,
  ContactListMainView
} from "@lcme/common";
import { IAccounts } from "@lcme/common/dist/src/components/commons/types/commonTypes";
import { IContactList } from "@lcme/common/dist/src/components/commons/types/contactListTypes";
import { IDialerDefaults } from '@lcme/common/dist/src/components/commons/types/globalTypes';
import { Component } from "react";

interface Props {
  dialerDefaults: IDialerDefaults;
  didSucceed: boolean;
  contactLists: any;
  accessLevel: AccessRoles;
  selectedAccount: IAccounts | undefined | "All";
  setAccount: (account_name: IAccounts | undefined | "All") => void;
  getContactLists: () => void;
  deleteContactListByID: (id: string) => Promise<any>;
  updateContactListByID: (
    editedContactListConfig: IContactList,
    id: string,
    initialContactListConfig: IContactList
  ) => Promise<any>;
  addContactList: (contactList: IContactList) => Promise<any>;
  getDialerDefaults: () => void;
}
interface State {}

export class ContactListView extends Component<Props, State> {
  state = {};

  handleContactListUpdate = (
    editedContactListConfig: IContactList,
    id: string,
    callback: (info: any) => void,
    initialContactListConfig
  ) => {
    this.props
      .updateContactListByID(
        editedContactListConfig,
        id,
        initialContactListConfig
      )
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" }, errorMessage: error.message });
      });
  };

  handleContactListAdd = (
    contactList: IContactList,
    callback: (info: any) => void
  ) => {
    this.props
      .addContactList(contactList)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" } });
      });
  };

  handleContactListDelete = (id, callback: (info: any) => void) => {
    this.props
      .deleteContactListByID(id)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" }, response: error?.response });
      });
  };

  render() {
    return (
      <ContactListMainView
        dialerDefaults={this.props.dialerDefaults}
        contactLists={this.props.contactLists}
        getContactLists={() => this.props.getContactLists()}
        deleteContactListByID={(id, callback: (info: any) => void) =>
          this.handleContactListDelete(id, callback)
        }
        updateContactListByID={(
          editedContactListConfig: IContactList,
          id: string,
          callback: (info: any) => void,
          initialContactListConfig: IContactList
        ) =>
          this.handleContactListUpdate(
            editedContactListConfig,
            id,
            callback,
            initialContactListConfig
          )
        }
        addContactList={(
          contactList: IContactList,
          callback: (info: any) => void
        ) => this.handleContactListAdd(contactList, callback)}
        accessLevel={this.props.accessLevel}
        getDialerDefaults={() => this.props.getDialerDefaults()}
        selectedAccount={this.props.selectedAccount}
        setAccount={(account: IAccounts | undefined | "All") =>
          this.props.setAccount(account)
        }
      />
    );
  }
}

export default ContactListView;
