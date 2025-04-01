import { DbConfig, KeyHashTagMode } from "../config/db-config";
import { NvAggregateError } from "./error-helper";

export function makeBaseRedisKey(dbConfig: DbConfig, entityType: string) {
    let key = entityType
    if (dbConfig.keyHashTagMode === KeyHashTagMode.ENTITY_TYPE) {
        key = `{${key}}`
    }
    if (dbConfig.namespace) {
        key = `${dbConfig.namespace}:${key}`
    }
    return key;
}

export function scanPipelineResultForErrors(pipelineResults: [Error | null, any][], throwError: boolean = false) {
    const errors: Error[] = []
    pipelineResults.forEach((fullResult) => {
        if (!Array.isArray(fullResult)) {
            errors.push(new Error(`Unexpected result from redis pipeline: ${fullResult}`))
            return;
        }
        const [error, result] = fullResult
        if (error) {
            errors.push(error)
        }
        if (Array.isArray(result)) {
            result.forEach((arrayResult) => {
                if (arrayResult instanceof Error) {
                    errors.push(arrayResult)
                }
            })
        }
    })
    if (throwError && errors.length > 0) {
        throw (errors.length === 1 ? errors[0] : new NvAggregateError(errors))
    }
    return errors
}