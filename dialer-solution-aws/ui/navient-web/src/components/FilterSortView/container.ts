import { IAccounts } from "@navient/common/dist/src/components/commons/types/commonTypes";
import { IFilter } from "@navient/common/dist/src/components/commons/types/filterTypes";
import { connect } from "react-redux";
import { getContactListList } from "../../redux/actions/CampaignActions";
import { setProjectAccount } from "../../redux/actions/ConfigActions";
import {
  addFilter,
  deleteFilterByID,
  getFiltersList,
  updateFilterByID,
  validateFilter,
} from "../../redux/actions/FilterActions";
import Component from "./FilterSortView";
import { RootState } from '../../redux/store';

const mapStateToProps = (state: RootState) => {
  return {
    contactLists: state.campaign.contactLists,
    filters: state.filter.filters,
    accessLevel: state.rolesAccess.role,
    returnedRecords: state.filter.returnedRecords,
    selectedAccount: state.config.selectedAccount,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  setAccount: (account_name: IAccounts | undefined | "All") =>
    dispatch(setProjectAccount(account_name)),
  getContactLists: () => dispatch(getContactListList()),
  getFilters: () => dispatch(getFiltersList()),
  addFilter: (filter: IFilter) => dispatch(addFilter(filter)),
  validateFilter: (filter: IFilter) => dispatch(validateFilter(filter)),
  deleteFilterByID: (id: string) => dispatch(deleteFilterByID(id)),
  updateFilterByID: (
    editedFilterConfig: IFilter,
    id: string,
    initialFilterConfig: IFilter
  ) => dispatch(updateFilterByID(editedFilterConfig, id, initialFilterConfig)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);
