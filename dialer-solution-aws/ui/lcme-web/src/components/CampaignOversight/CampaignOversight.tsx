import { AccessRoles, CampaignOversightMainView } from "@lcme/common";
import { IAccounts } from "@lcme/common/dist/src/components/commons/types/commonTypes";
import { Component } from "react";
import { getScheduleExecutions } from "../../redux/actions/CampaignOversightActions";
import { ISchedule } from '@lcme/common/dist/src/components/commons/types/schedulerTypes';
import { IDialerDefaults } from '@lcme/common/dist/src/components/commons/types/globalTypes';
import { OversightStats } from 'lcme-common/lib/types/oversight-stats';
import { CampaignPacingDefinition } from 'lcme-common/lib/models/campaign';

interface Props {
  dialerDefaults: IDialerDefaults;
  scheduleExecutions: OversightStats[];
  didSucceed: boolean;
  accessLevel: AccessRoles;
  selectedAccount: IAccounts | undefined | 'All';
  schedules: ISchedule[];
  setAccount: (account_name: IAccounts | undefined | 'All') => void;
  getScheduleExecutions: () => void;
  getDialerDefaults: () => void;
  controlScheduleExecution: (
    action: string,
    scheduleExecutionId: string,
    pacing?: Partial<CampaignPacingDefinition>
  ) => Promise<any>;
  getSchedules: () => void;
}
interface State { }

export class CampaignOversightView extends Component<Props, State> {
  state = {};
  handleControlScheduleExecution = (
    action: string,
    scheduleExecutionId: string,
    callback: (info: any) => void,
    pacing?: Partial<CampaignPacingDefinition>,
  ) => {
    this.props
      .controlScheduleExecution(action, scheduleExecutionId, pacing)
      .then((data) => {
        callback(data);
        getScheduleExecutions();
      })
      .catch((error) => {
        callback({ action: { type: 'error' } });
      });
  };

  render() {
    return (
      <CampaignOversightMainView
        scheduleExecutions={this.props.scheduleExecutions}
        didSucceed={this.props.didSucceed}
        schedules={this.props.schedules}
        getSchedules={() => this.props.getSchedules()}
        getScheduleExecutions={() => this.props.getScheduleExecutions()}
        controlScheduleExecution={(
          action: string,
          scheduleExecutionId: string,
          callback: (info: any) => void,
          pacing?: Partial<CampaignPacingDefinition>
        ) => this.handleControlScheduleExecution(action, scheduleExecutionId, callback, pacing)}
        dialerDefaults={this.props.dialerDefaults}
        getDialerDefaults={() => this.props.getDialerDefaults()}
        accessLevel={this.props.accessLevel}
        // getCampaigns={() => this.props.getCampaigns()}
        // updateCampaignByID={(
        //   campaign: ICampaign,
        //   id: string,
        //   callback: (info: any) => void
        // ) => this.handleCampaignUpdate(campaign, id, callback)}
        selectedAccount={this.props.selectedAccount}
        setAccount={(account: IAccounts | undefined | 'All') => this.props.setAccount(account)}
      />
    );
  }
}

export default CampaignOversightView;
