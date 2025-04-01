import { IAccounts } from '@lcme/common/dist/src/components/commons/types/commonTypes';
import {
  IGlobalConfig
} from '@lcme/common/dist/src/components/commons/types/globalTypes';
import { connect } from 'react-redux';
import { getContactFlowList } from '../../redux/actions/CampaignActions';
import { getAWSRegions, setProjectAccount } from '../../redux/actions/ConfigActions';
import {
  getGlobalConfig,
  getDialerDefaults,
  updateGlobalConfig,
} from '../../redux/actions/GlobalActions';
import Component from './ConfigView';
import { RootState } from '../../redux/store';

const mapStateToProps = (state: RootState) => {
  return {
    accessLevel: state.rolesAccess.role,
    contactFlows: state.config.contactFlows,
    awsRegions: state.config.awsRegions,
    connectConfig: state.global.connectConfig,
    dialerDefaultsConfig: state.global.dialerDefaultsConfig,
    initialGlobalConfig: state.global.initialGlobalConfig!, // TODO: Determine a default value for this
    selectedAccount: state.config.selectedAccount,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  setAccount: (account_name: IAccounts | undefined | 'All') =>
    dispatch(setProjectAccount(account_name)),
  getContactFlowList: () => dispatch(getContactFlowList()),
  getDialerDefaults: () => dispatch(getDialerDefaults()),
  getGlobalConfig: () => dispatch(getGlobalConfig()),
  getAWSRegions: () => dispatch(getAWSRegions()),
  updateGlobal: (global: any, initialGlobalConfig: IGlobalConfig) =>
    dispatch(updateGlobalConfig(global, initialGlobalConfig)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);
