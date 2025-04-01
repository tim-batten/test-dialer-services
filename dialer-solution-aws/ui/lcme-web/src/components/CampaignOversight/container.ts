import { IAccounts } from "@lcme/common/dist/src/components/commons/types/commonTypes";
import { connect } from "react-redux";
import {
  controlScheduleExecution,
  getScheduleExecutions,
} from "../../redux/actions/CampaignOversightActions";
import { setProjectAccount } from "../../redux/actions/ConfigActions";
import {
  getDialerDefaults
} from "../../redux/actions/GlobalActions";
import { getSchedule } from "../../redux/actions/SchedulerActions";
import Component from "./CampaignOversight";
import { RootState } from '../../redux/store';
import { CampaignPacingDefinition } from 'lcme-common/lib/models/campaign';

const mapStateToProps = (state: RootState) => ({
  scheduleExecutions: state.campaignOversight.scheduleExecutions,
  didSucceed: state.campaignOversight.didSucceed,
  dialerDefaults: state.global.dialerDefaultsConfig,
  accessLevel: state.rolesAccess.role,
  selectedAccount: state.config.selectedAccount,
  schedules: state.schedule.schedules,
});

const mapDispatchToProps = (dispatch: any, state: any) => ({
  setAccount: (account_name: IAccounts | undefined | 'All') => dispatch(setProjectAccount(account_name)),
  getScheduleExecutions: () => dispatch(getScheduleExecutions()),
  controlScheduleExecution: (action: string, scheduleExecutionId: string, pacing?: Partial<CampaignPacingDefinition>) =>
    dispatch(controlScheduleExecution(action, scheduleExecutionId, pacing)),
  getDialerDefaults: () => dispatch(getDialerDefaults()),
  getSchedules: () => dispatch(getSchedule()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);
