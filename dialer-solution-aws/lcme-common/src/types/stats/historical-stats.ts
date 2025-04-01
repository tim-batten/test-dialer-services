import { Stats, SettableKeys, NonAggregateKeys, StatMap } from './stats';

export const HistoricalStatsMap = new Stats({
  disconnected_from_agent: {
    onAdd: {
      negateStats: ['in_flight', 'active', 'connected_to_agent'],
    },
    inverseOf: 'connected_to_agent',
  },
  queued: {
    onAdd: {
      negateStats: ['in_flight'],
    },
  },
  abandoned_ivr: {
    onAdd: {
      negateStats: ['in_flight', 'active'],
    },
  },
  abandoned_queue: {
    onAdd: {
      negateStats: ['in_flight', 'active'],
    },
  },
  initiated: {
    onAdd: {
      addStats: ['in_flight', 'active'],
    },
  },
  connected_to_agent: {
    onAdd: {
      addStats: ['connects_to_agents'],
      negateStats: ['in_flight'],
    },
  },
  in_flight_timeout: {
    onAdd: {
      negateStats: ['in_flight'],
    },
  },
  in_flight: {
    implicitlySet: true,
  },
  active: {
    implicitlySet: true,
  },
  abandoned: {
    aggregateOf: ['abandoned_ivr', 'abandoned_queue'],
  },
  connects_to_agents: {
    implicitlySet: true,
  },
  disconnected: {
    inverseOf: 'active',
  },
  not_in_flight: {
    inverseOf: 'in_flight',
  },
});
export type HistoricalStatsType = (typeof HistoricalStatsMap)['stats'];
export type HistoricalStatsKey = keyof HistoricalStatsType;
export type HistoricalStatsSettableKey = SettableKeys<HistoricalStatsType>;
export type HistoricalNonAggregateStatsKey = NonAggregateKeys<HistoricalStatsType>;
export type HistoricalStats = StatMap<HistoricalStatsType>;

export const zeroHistoricalStats: HistoricalStats = {
  initiated: 0,
  queued: 0,
  connects_to_agents: 0,
  abandoned_ivr: 0,
  abandoned_queue: 0,
  abandoned: 0,
  in_flight: 0,
  not_in_flight: 0,
  active: 0,
  disconnected: 0,
  disconnected_from_agent: 0,
  in_flight_timeout: 0,
  connected_to_agent: 0,
};

export const AllHistoricalStatsTypes = Object.keys(HistoricalStatsMap.stats) as HistoricalStatsKey[];