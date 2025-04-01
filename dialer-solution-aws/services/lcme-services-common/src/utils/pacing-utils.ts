import { AbaCalculationMode } from 'lcme-common/lib/models/campaign';
import { Logger, LoggerOptions } from '../logger/logger';
import { PacingHistoricalStats } from 'lcme-common/lib/types/stats/pacing-stats';

export const calculateAbandonRate = (
  abaCalculation: AbaCalculationMode,
  historicalStats: PacingHistoricalStats,
  logOpts?: {
    loggerOptions: Partial<LoggerOptions>;
    logger: Logger;
  }
) => {
  let abaDenominator;
  let abaDenominatorName;
  switch (abaCalculation) {
    case 'Calls':
      abaDenominator = historicalStats.initiated;
      abaDenominatorName = 'total calls placed';
      break;
    case 'Connects':
      abaDenominator = historicalStats.connects_to_agents;
      abaDenominatorName = 'connects_to_agents';
      break;
    case 'Detects':
      abaDenominator = historicalStats.queued;
      abaDenominatorName = 'queued';
      break;
    default:
      abaDenominator = historicalStats.initiated;
      logOpts &&
        logOpts.logger.log(
          'warn',
          `ABA calculation ${abaCalculation} is unrecognized - using total calls placed: ${abaDenominator}`,
          logOpts.loggerOptions
        );
      break;
  }

  const abandonRate =
    historicalStats.abandoned_queue === 0 || abaDenominator === 0
      ? 0.001
      : Math.max(0.001, historicalStats.abandoned_queue / abaDenominator);
  logOpts &&
    logOpts.logger.log(
      'info',
      `ABA calculation mode is ${abaCalculation}. Abandon rate is ${abandonRate} (${historicalStats.abandoned_queue} tasks_canceled / ${abaDenominator} ${abaDenominatorName})`,
      logOpts.loggerOptions
    );
  return abandonRate;
};
