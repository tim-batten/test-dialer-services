import { CurrentStats, zeroCurrentStats } from './current-stats';
import { HistoricalStats } from './historical-stats';

export const PacingHistoricalStatsKeys = [
  'initiated',
  'queued',
  'connects_to_agents',
  'abandoned_ivr',
  'abandoned_queue',
  'abandoned',
  'in_flight',
  'not_in_flight',
] as const;
export type PacingHistoricalStatsKey = (typeof PacingHistoricalStatsKeys)[number];
export const PacingHistoricalStatsKeysAs = PacingHistoricalStatsKeys as any as PacingHistoricalStatsKey[];
export type PacingHistoricalStats = {
  [key in PacingHistoricalStatsKey]: number;
};

export type PacingStats = {
  current: CurrentStats;
  historical: PacingHistoricalStats;
};

export const zeroPacingStats: PacingStats = {
  current: zeroCurrentStats,
  historical: {
    initiated: 0,
    queued: 0,
    connects_to_agents: 0,
    abandoned_ivr: 0,
    abandoned_queue: 0,
    abandoned: 0,
    in_flight: 0,
    not_in_flight: 0,
  },
};
