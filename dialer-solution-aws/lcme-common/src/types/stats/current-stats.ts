
const currentStatsTypes = ['availableAgents', 'nonProductiveAgents'] as const;
type CurrentStatsType = (typeof currentStatsTypes)[number];
export type CurrentStats = {
  [key in CurrentStatsType]: number;
};

export const zeroCurrentStats: CurrentStats = {
  availableAgents: 0,
  nonProductiveAgents: 0,
};
