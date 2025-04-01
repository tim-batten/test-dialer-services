import { AccessRoles, ConfigMainView } from '@navient/common';
import { IAccounts } from '@navient/common/dist/src/components/commons/types/commonTypes';
import { IConnect, IDialerDefaults, IGlobalConfig } from "@navient/common/dist/src/components/commons/types/globalTypes";
import { Component } from 'react';
import { RootState } from '../../redux/store';
import { ContactFlowInfo } from '@navient/common/dist/src/types/connect-contact-flow';

interface Props {
  selectedAccount: IAccounts | undefined | 'All';
  contactFlows: ContactFlowInfo[];
  accessLevel: AccessRoles;
  getContactFlowList: () => void;
  connectConfig: IConnect;
  dialerDefaultsConfig: IDialerDefaults;
  initialGlobalConfig: IGlobalConfig;
  dialerDefaults: IDialerDefaults;
  setAccount: (account_name: IAccounts | undefined | 'All') => void;
  getDialerDefaults: () => void;
  getGlobalConfig: () => void;
  getAWSRegions: () => void;
  updateGlobal: (global: any, initialGlobalConfig: IGlobalConfig) => Promise<any>;
  awsRegions: string[]
}

export class ConfigView extends Component<Props, RootState> {

  render() {
    return (
      <ConfigMainView
        updateGlobal={(global: any, callback: (info: any) => void, initialGlobalConfig: IGlobalConfig) =>
          this.props
            .updateGlobal(global, initialGlobalConfig)
            .then((data) => {
              callback(data);
            })
            .catch((error) => {
              callback({
                action: { type: 'error' },
                errorMessage: error.message,
              });
            })
        }
        getDialerDefaults={() => this.props.getDialerDefaults()}
        getGlobalConfig={() => this.props.getGlobalConfig()}
        getAWSRegions={() => this.props.getAWSRegions()}
        connectConfig={this.props.connectConfig}
        accessLevel={this.props.accessLevel}
        dialerDefaultsConfig={this.props.dialerDefaultsConfig}
        dialerDefaults={this.props.dialerDefaults}
        initialGlobalConfig={this.props.initialGlobalConfig}
        contactFlows={this.props.contactFlows}
        getContactFlowList={() => this.props.getContactFlowList()}
        selectedAccount={this.props.selectedAccount}
        setAccount={(account: IAccounts | undefined | 'All') => this.props.setAccount(account)}
        awsRegions={this.props.awsRegions}
      />
    );
  }
}

export default ConfigView;
