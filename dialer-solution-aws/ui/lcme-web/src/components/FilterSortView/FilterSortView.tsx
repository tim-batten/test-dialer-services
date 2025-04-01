import { AccessRoles, FilterSortMainView } from "@lcme/common";
import { IAccounts } from "@lcme/common/dist/src/components/commons/types/commonTypes";
import { IFilter } from "@lcme/common/dist/src/components/commons/types/filterTypes";
import { Component } from "react";

interface Props {
  contactLists: any;
  selectedAccount: IAccounts | undefined | "All";
  getContactLists: () => void;
  filters: any;
  accessLevel: AccessRoles;
  setAccount: (account_name: IAccounts | undefined | "All") => void;
  getFilters: () => void;
  addFilter: (filter: IFilter) => Promise<any>;
  validateFilter: (filter: IFilter) => Promise<any>;
  deleteFilterByID: (id: string) => Promise<any>;
  updateFilterByID: (
    editedFilterConfig: IFilter,
    id: string,
    initialFilterConfig: IFilter
  ) => Promise<any>;
  returnedRecords: {
    timestamp: string;
    returnedRecords: any;
  };
}
interface State {}

export class FilterSortView extends Component<Props, State> {
  state = {};
  handleFilterAdd = (filter: IFilter, callback: (info: any) => void) => {
    this.props
      .addFilter(filter)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" } });
      });
  };
  handleFilterValidate = (filter: IFilter, callback: (info: any) => void) => {
    this.props
      .validateFilter(filter)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" } });
      });
  };
  handleFilterUpdate = (
    editedFilterConfig: IFilter,
    id: string,
    callback: (info: any) => void,
    initialFilterConfig: IFilter
  ) => {
    this.props
      .updateFilterByID(editedFilterConfig, id, initialFilterConfig)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" }, errorMessage: error.message });
      });
  };
  handleFilterDelete = (id, callback: (info: any) => void) => {
    this.props
      .deleteFilterByID(id)
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        callback({ action: { type: "error" }, response: error.response });
      });
  };

  render() {
    return (
      <FilterSortMainView
        filters={this.props.filters}
        contactLists={this.props.contactLists}
        getContactLists={() => this.props.getContactLists()}
        getFilters={() => this.props.getFilters()}
        returnedRecords={this.props.returnedRecords}
        addFilter={(filter: IFilter, callback: (info: any) => void) =>
          this.handleFilterAdd(filter, callback)
        }
        validateFilter={(filter: IFilter, callback: (info: any) => void) =>
          this.handleFilterValidate(filter, callback)
        }
        deleteFilterByID={(id, callback: (info: any) => void) =>
          this.handleFilterDelete(id, callback)
        }
        updateFilterByID={(
          editedFilterConfig: IFilter,
          id: string,
          callback: (info: any) => void,
          initialFilterConfig
        ) =>
          this.handleFilterUpdate(
            editedFilterConfig,
            id,
            callback,
            initialFilterConfig
          )
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

export default FilterSortView;
