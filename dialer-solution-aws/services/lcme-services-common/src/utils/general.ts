import { isNumber } from 'lodash';
import { Logger } from '../logger/logger';

const logger = Logger.getLogger();

// Creates a setTimeout loop that adjusts time for next execution based on this execution
type SetTimeoutLoopOpts = {
  /** If set to true, the loop will catch up if it is behind schedule (e.g. if loop is every 100ms and pauses for 500ms, it will run 5 times to catch up)
      Default: false */
  catchup?: boolean;
  /** If set to true, the loop will run immediately on start */
  immediate?: boolean;
  /** If set to true, the loop will log every execution */
  logExecs?: boolean;
};
/**
 * Creates a setTimeout loop that adjusts time for next execution based on this execution
 * @param func The function to run on each loop
 * @param name Name of the loop (for logging)
 * @param timeout Timeout between each loop
 * @param opts Options
 */
export async function setTimeoutLoop(
  func: () => Promise<boolean | number | void> | boolean,
  name: string,
  timeout: number,
  opts: SetTimeoutLoopOpts = {}
) {
  const { catchup = false, immediate = false, logExecs = false } = opts;
  logger.log('verbose', `setTimeoutLoop: starting "${name}". Immediate: ${immediate}. Timeout: ${timeout}ms`);
  let lastRunTime = Date.now();
  const handlerActual = async () => {
    logExecs && logger.log('silly', `setTimeoutLoop: Running "${name}"`);
    let result;
    try {
      result = await func();
      if (result === false) {
        logger.log('info', `setTimeoutLoop: Ending "${name}" loop as function returned false`);
        return;
      }
    } catch (e) {
      logger.mlog('error', [`setTimeoutLoop: Unhandled error in setTimeoutLoop for fn "${name}"`, e]);
    }
    timeout = isNumber(result) ? result : timeout;
    lastRunTime = catchup ? lastRunTime : Math.max(lastRunTime, Date.now() - timeout);
    const nextRunTime = lastRunTime + timeout;
    lastRunTime = nextRunTime;
    let adjustedTimeout = nextRunTime - Date.now();
    logExecs && logger.log('silly', `setTimeoutLoop: Run "${name}", next execution in ${adjustedTimeout}ms`);
    setTimeout(handlerActual, adjustedTimeout);
  };
  if (immediate) {
    await handlerActual();
  } else {
    lastRunTime += timeout;
    setTimeout(handlerActual, immediate ? 0 : timeout);
  }
}

export async function repeatFuncOnInterval(
  func: () => Promise<boolean> | boolean,
  interval: number,
  immediateStart = false
) {
  const delay: number = interval - (Date.now() % interval);

  async function start() {
    try {
      const continueRunning = await func();
      if (continueRunning === false) {
        return;
      }
    } catch (e) {
      logger.mlog('error', ['Unhandled error in repeatFuncOnInterval', e]);
    }
    repeatFuncOnInterval(func, interval);
  }
  if (immediateStart) {
    start();
  } else {
    setTimeout(start, delay);
  }
}

export async function safeSetInterval(
  func: () => Promise<boolean> | boolean,
  name: string,
  interval: number,
  immediateStart = false
) {
  logger.log('verbose', `safeSetInterval: starting "${name}". Immediate: ${immediateStart}. Interval: ${interval}ms`);
  async function handlerActual() {
    try {
      func();
    } catch (e) {
      logger.mlog('error', [`safeSetInterval: Unhandled error running "${name}"`, e]);
    }
  }
  if (immediateStart) {
    await handlerActual();
  }
  setInterval(handlerActual, interval);
}

export function removeEmpties<T>(array: (T | undefined | null)[]): T[] {
  return array.filter((value) => value !== undefined && value !== null) as T[];
}
export const mapToObj = (map: Map<any, any>) => {
  const obj: any = {};
  for (let [k, v] of map) obj[k] = v;
  return obj;
};

const toSafeValue = (value: any): SafeValue => {
  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return value;
  } else if (value instanceof Date) {
    return value.toISOString();
  } else if (Array.isArray(value)) {
    return toSafeArray(value);
  } else if (typeof value === 'object') {
    return objectToSafeRecord(value);
  }else {
    return value.toString ? value.toString() : `${value}`;
  }
};

export const toSafeArray = (array: any[]) => {
  return array.map((value) => toSafeValue(value));
};

export type SafeValue = string | number | boolean | SafeRecord | SafeValue[];

export type SafeRecord = {
  [key: string]: SafeValue;
};

export const objectToSafeRecord = (obj: object): SafeRecord => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[key] = toSafeValue(value);
    return acc;
  }, {} as SafeRecord);
};