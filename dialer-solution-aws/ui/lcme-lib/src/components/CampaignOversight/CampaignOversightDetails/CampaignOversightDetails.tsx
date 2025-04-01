/* eslint-disable no-empty-pattern */
import React from 'react';
import { Wrapper } from './CampaignOversightDetails.Styles';
import { CampaignOversightForm } from './CampaignOversightForm';
import { ActionType } from '../../commons/types/oversightTypes';
import { ISchedule } from '../../commons/types/schedulerTypes';
import { IDialerDefaults } from '../../commons/types/globalTypes';
import { OversightStats } from 'lcme-common/lib/types/oversight-stats';
import { CampaignPacingDefinition } from 'lcme-common/lib/models/campaign';

interface ICampaignOversightDetails {
  selectedScheduleExecution: OversightStats;
  onDiscardClick: () => void;
  controlScheduleExecution: (
    action: ActionType,
    scheduleExecutionId: string,
    callback: (info: any) => void,
    pacing?: Partial<CampaignPacingDefinition>,
  ) => void;
  dialerDefaults: IDialerDefaults;
  schedules: ISchedule[];
  onAccountChange: (url: string) => any;
}

export const CampaignOversightDetails: React.FunctionComponent<
  ICampaignOversightDetails
> = (
  {
    selectedScheduleExecution,
    controlScheduleExecution,
    onDiscardClick,
    dialerDefaults,
    onAccountChange,
    schedules,
  },
  props,
) => {
  return (
    <Wrapper>
      <CampaignOversightForm
        dialerDefaults={dialerDefaults}
        onDiscardClick={onDiscardClick}
        selectedRow={selectedScheduleExecution}
        schedules={schedules}
        controlScheduleExecution={(
          action: ActionType,
          scheduleExecutionId: string,
          callback: (info: any) => void,
          pacing?: Partial<CampaignPacingDefinition>,
        ) =>
          controlScheduleExecution(
            action,
            scheduleExecutionId,
            callback,
            pacing,
          )
        }
        onAccountChange={(url) => onAccountChange(url)}
      />
      {/* <CampaignOversightLogs /> */}
    </Wrapper>
  );
};

CampaignOversightDetails.defaultProps = {
  // bla: 'test',
};
