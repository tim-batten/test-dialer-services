import { isString } from "lodash"

export const formatError = (e: any) => {
    if (isString(e)) {
        return {
            message: e
        }
    }
    if (e.message) {
        return {
            message: e.message
        }
    }
    return e
}

export class NvAggregateError extends Error {
    constructor(errors: Error[]) {
        super(`Multiple errors occurred: [${errors.join(', ')}]`)
    }
}