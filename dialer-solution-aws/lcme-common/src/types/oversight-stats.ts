import { CampaignPacingDefinition } from '../models/campaign';
import { ScheduleExecutionStatus } from '../models/schedule-execution';
import { CurrentStats } from './stats/current-stats';
import { HistoricalStats } from './stats/historical-stats';

export type AbandonRates = {
  detects: number;
  connects: number;
  calls: number;
}

export type OversightStats = {
  scheduleId: string;
  scheduleName: string;
  scheduleExecutionId: string;
  startTime: Date;
  endTime?: Date;
  executionStartTime?: Date;
  scheduleTimezone: string;
  duration: number;
  campaignWeight: number;
  campaignMode: string;
  status: ScheduleExecutionStatus | 'UNKNOWN';
  campaignInfo: {
    campaignId: string;
    campaignName: string;
    queue: string;
    contactFlowId: string;
  };
  progressInfo: {
    sequenceProgress?: {
      recordsToDial?: number;
      recordsAttempted?: number;
      lastPacingCalculation?: number;
      lastAbandonRate?: number;
      lastCPA?: number;
    };
    scheduleProgress?: {
      numSequences?: number;
      numLoops?: number;
      totalSequences?: number;
      currentSequenceIndex?: number;
      currentLoop?: number;
      currentSequence?: number;
    };
    currentSequenceInfo?: {
      currentSequenceName?: string;
      activePhoneTypes?: string[];
      currentCampaignExecutionId?: string;
      filters?: {
        id: string;
        name: string;
        type: string;
      }[];
    };
  };
  queueInfo: {
    queueId: string;
    queueName?: string;
  };
  /**
   * Campaign stats since last stats reset
   */
  campaignStats: {
    campaign?: {
      historicalStats: HistoricalStats | null | undefined;
      abandonRates: AbandonRates;
    };
    campaignExecution?: {
      historicalStats: HistoricalStats | null | undefined;
      abandonRates: AbandonRates;
    };
    lastContactEvent: Date | null;
    current?: CurrentStats | null;
  };
  pacing?: CampaignPacingDefinition;
};
