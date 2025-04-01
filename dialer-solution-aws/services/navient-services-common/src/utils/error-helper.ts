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