/** Set on basic stats */
type BasicStatProps<SETTABLE_KEYS extends string> = {
  onAdd?: {
    addStats?: SETTABLE_KEYS[];
    negateStats?: SETTABLE_KEYS[];
  };
};

type ImplicitlySetStatProps = {
  implicitlySet: true;
};

/** Can be inverse of any settable stat */
type InvertedStatProps<SETTABLE_KEYS extends string> = BasicStatProps<SETTABLE_KEYS> & {
  inverseOf: SETTABLE_KEYS;
};

/** Can be aggregate of any settable OR inverted stat */
type AggregateStatProps<SETTABLE_INVERTABLE_KEYS extends string> = {
  aggregateOf: SETTABLE_INVERTABLE_KEYS[];
};

type StatProps<SETTABLE_KEYS extends string, SETTABLE_INVERTABLE_KEYS extends string> =
  | InvertedStatProps<SETTABLE_KEYS>
  | AggregateStatProps<SETTABLE_INVERTABLE_KEYS>
  | BasicStatProps<SETTABLE_KEYS>
  | ImplicitlySetStatProps;

const isSettable = <SETTABLE_KEYS extends string>(
  props: StatProps<SETTABLE_KEYS, string>
): props is BasicStatProps<SETTABLE_KEYS> => {
  return !('inverseOf' in props || 'aggregateOf' in props);
};
const isImplicitlySet = <SETTABLE_KEYS extends string>(
  props: StatProps<SETTABLE_KEYS, string>
): props is ImplicitlySetStatProps => {
  return 'implicitlySet' in props;
};
const isInverted = <SETTABLE_KEYS extends string, SETTABLE_INVERTABLE_KEY extends string>(
  props: StatProps<SETTABLE_KEYS, SETTABLE_INVERTABLE_KEY>
): props is InvertedStatProps<SETTABLE_KEYS> => {
  return 'inverseOf' in props;
};
const isAggregate = <SETTABLE_INVERTABLE_KEYS extends string>(
  props: StatProps<string, SETTABLE_INVERTABLE_KEYS>
): props is AggregateStatProps<SETTABLE_INVERTABLE_KEYS> => {
  return 'aggregateOf' in props;
};
const isDbKey = <SETTABLE_KEYS extends string, SETTABLE_INVERTABLE_KEYS extends string>(
  props: StatProps<SETTABLE_KEYS, SETTABLE_INVERTABLE_KEYS>
): props is BasicStatProps<SETTABLE_KEYS> | ImplicitlySetStatProps => {
  return !('inverseOf' in props || 'aggregateOf' in props);
}

type StatPropMap<SETTABLE_KEYS extends string, INVERTED_KEYS extends string, AGGREGATE_KEYS extends string> = {
  [key in SETTABLE_KEYS | INVERTED_KEYS | AGGREGATE_KEYS]: StatProps<SETTABLE_KEYS, INVERTED_KEYS>;
};
export type StatMap<STAT_MAP extends object> = {
  [key in keyof STAT_MAP]: number;
};

// Implicitly set or aggregate are not settable
export type SettableKeys<STAT_MAP extends StatPropMap<string, string, string>> = {
  [K in keyof STAT_MAP]: STAT_MAP[K] extends { implicitlySet: true } | { aggregateOf: infer AGGREGATE_KEYS }
    ? never
    : K;
}[keyof STAT_MAP];
export type ImplicitlySetKeys<STAT_MAP extends StatPropMap<string, string, string>> = {
  [K in keyof STAT_MAP]: STAT_MAP[K] extends { implicitlySet: true } ? K : never;
}[keyof STAT_MAP];
export type InvertedKeys<STAT_MAP extends StatPropMap<string, string, string>> = {
  [K in keyof STAT_MAP]: STAT_MAP[K] extends { inverseOf: infer SETTABLE_KEYS } ? K : never;
}[keyof STAT_MAP];
export type AggregateKeys<STAT_MAP extends StatPropMap<string, string, string>> = {
  [K in keyof STAT_MAP]: STAT_MAP[K] extends { aggregateOf: infer AGGREGATE_KEYS } ? K : never;
}[keyof STAT_MAP];
export type NonAggregateKeys<STAT_MAP extends StatPropMap<string, string, string>> = {
  [K in keyof STAT_MAP]: STAT_MAP[K] extends { aggregateOf: infer AGGREGATE_KEYS } ? never : K;
}[keyof STAT_MAP];

type AllStatKeys<STAT_MAP extends StatPropMap<string, string, string>> =
  | SettableKeys<STAT_MAP>
  | InvertedKeys<STAT_MAP>
  | AggregateKeys<STAT_MAP>;

export type StatKeyInfo<STAT_MAP extends StatPropMap<string, string, string>> = {
  dbKey: SettableKeys<STAT_MAP>;
  requestedKey: keyof STAT_MAP;
  inverted: boolean;
};

export class Stats<STAT_MAP extends StatPropMap<string, string, string>> {
  constructor(readonly stats: STAT_MAP) {}

  dbKeys(): (keyof STAT_MAP)[] {
    return Object.keys(this.stats).filter((key) => isDbKey(this.stats[key])) as (keyof STAT_MAP)[];
  }

  settableKeys(): SettableKeys<STAT_MAP>[] {
    return Object.keys(this.stats).filter((key) => isSettable(this.stats[key])) as SettableKeys<STAT_MAP>[];
  }

  invertedKeys(): InvertedKeys<STAT_MAP>[] {
    return Object.keys(this.stats).filter((key) => isInverted(this.stats[key])) as InvertedKeys<STAT_MAP>[];
  }

  aggregateKeys(): AggregateKeys<STAT_MAP>[] {
    return Object.keys(this.stats).filter((key) => isAggregate(this.stats[key])) as AggregateKeys<STAT_MAP>[];
  }

  getRequiredNonAggregateKey(requestedKey: keyof STAT_MAP): StatKeyInfo<STAT_MAP> | null {
    const stat = this.stats[requestedKey];
    if (isSettable(stat)) {
      return {
        dbKey: requestedKey as SettableKeys<STAT_MAP>,
        requestedKey,
        inverted: false,
      };
    } else if (isInverted(stat)) {
      return {
        dbKey: stat.inverseOf as SettableKeys<STAT_MAP>,
        requestedKey,
        inverted: true,
      };
    }
    return null;
  }

  private getRequiredKeys(requestedKey: keyof STAT_MAP): StatKeyInfo<STAT_MAP>[] {
    const stat = this.stats[requestedKey];
    if (isAggregate(stat)) {
      const toReturn = [];
      for (const key of stat.aggregateOf) {
        const val = this.getRequiredNonAggregateKey(key);
        if (!val) {
          throw new Error(`Unknown stat type for ${key as string}`);
        }
        toReturn.push(val);
        return toReturn;
      }
    }
    const toReturn = this.getRequiredNonAggregateKey(requestedKey);
    if (!toReturn) {
      throw new Error(`Unknown stat type for ${requestedKey as string}`);
    }
    return [toReturn];
  }

  getRequiredDbKeys(requestedKeys: (keyof STAT_MAP)[] | keyof STAT_MAP): StatKeyInfo<STAT_MAP>[] {
    requestedKeys = Array.isArray(requestedKeys) ? requestedKeys : [requestedKeys];
    const keySet = new Set<keyof STAT_MAP>();
    const toReturn = [];
    for (const requestedKey of requestedKeys) {
      const requiredKeys = this.getRequiredKeys(requestedKey);
      for (const requiredKey of requiredKeys) {
        if (!keySet.has(requiredKey.requestedKey)) {
          keySet.add(requiredKey.requestedKey);
          toReturn.push(requiredKey);
        }
      }
    }
    return toReturn;
  }

  reduceStatResults(stats: number[], requestedKeys: StatKeyInfo<STAT_MAP>[], allRequestedKeys: (keyof STAT_MAP)[]) {
    // Get our basic DB result map
    const toReturn: StatMap<STAT_MAP> = stats.reduce((acc, stat, index) => {
      const requestedKey = requestedKeys[index];
      acc[requestedKey.requestedKey] = stat;
      return acc;
    }, {} as StatMap<STAT_MAP>);
    // Now do our aggregations
    allRequestedKeys.forEach((requestedKey) => {
      // if it's aggregate
      const stat = this.stats[requestedKey];
      if (isAggregate(stat)) {
        const aggregate = stat.aggregateOf.reduce((acc, key) => acc + toReturn[key], 0);
        toReturn[requestedKey] = aggregate;
      }
    });
    return toReturn;
  }

  private getStatsToSetForStat(stat: SettableKeys<STAT_MAP> | InvertedKeys<STAT_MAP>): {
    add: SettableKeys<STAT_MAP>[];
    invert: SettableKeys<STAT_MAP>[];
  } {
    const statDef = this.stats[stat] as BasicStatProps<any> | InvertedStatProps<any>;
    const inverted: SettableKeys<STAT_MAP> | null = isInverted(statDef) ? statDef.inverseOf : null;
    const add: SettableKeys<STAT_MAP>[] = inverted ? [] : [stat as SettableKeys<STAT_MAP>];
    const invert: SettableKeys<STAT_MAP>[] = inverted ? [inverted] : [];

    if (statDef.onAdd) {
      add.push(...(statDef.onAdd.addStats || []));
      invert.push(...(statDef.onAdd.negateStats || []));
    }
    return {
      add,
      invert,
    };
  }

  getStatsToSet(stats: (SettableKeys<STAT_MAP> | InvertedKeys<STAT_MAP>)[]): {
    add: SettableKeys<STAT_MAP>[];
    invert: SettableKeys<STAT_MAP>[];
  } {
    const add = new Set<SettableKeys<STAT_MAP>>();
    const invert = new Set<SettableKeys<STAT_MAP>>();
    stats.forEach((stat) => {
      const { add: addStats, invert: invertStats } = this.getStatsToSetForStat(stat);
      addStats.forEach((stat) => add.add(stat));
      invertStats.forEach((stat) => invert.add(stat));
    });
    for (const invertStat of invert) {
      add.delete(invertStat);
    }
    return {
      add: [...add],
      invert: [...invert],
    };
  }
}
