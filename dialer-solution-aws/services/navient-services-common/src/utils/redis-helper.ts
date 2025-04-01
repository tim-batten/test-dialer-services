import { DbConfig, KeyHashTagMode } from '../config/db-config';

export function makeBaseRedisKey(dbConfig: DbConfig, entityType: string) {
  let key = entityType;
  if (dbConfig.keyHashTagMode === KeyHashTagMode.ENTITY_TYPE) {
    key = `{${key}}`;
  }
  if (dbConfig.namespace) {
    key = `${dbConfig.namespace}:${key}`;
  }
  return key;
}

export function scanPipelineResultForErrors(pipelineResults: [Error | null, any][], throwError: boolean = false) {
  const errors: PipelineError[] = [];
  pipelineResults.forEach((fullResult, index) => {
    if (!Array.isArray(fullResult)) {
      errors.push({
        error: new Error(`Unexpected result from redis pipeline: ${fullResult}`),
        index,
      });

      return;
    }
    const [error, result] = fullResult;
    if (error) {
      errors.push({
        error,
        index,
      });
    }
    if (Array.isArray(result)) {
      result.forEach((arrayResult) => {
        if (arrayResult instanceof Error) {
          errors.push({
            error: arrayResult,
            index,
          });
        }
      });
    }
  });
  if (throwError && errors.length > 0) {
    throw errors.length === 1 ? errors[0] : new PipelineAggregateError(errors);
  }
  return errors;
}

type PipelineError = {
    error: Error,
    index: number
}
export class PipelineAggregateError extends Error {
  constructor(errors: PipelineError[]) {
    super(`Multiple errors occurred: [${errors.join(', ')}]`);
  }
}