export function getNumberOrDefault(number: unknown, defaultVal: number): number {
    if (typeof number === 'number') {
        if (isNaN(number)) {
            return defaultVal
        }
        if (!isFinite(number)) {
            return defaultVal
        }
        return number
    } else if (typeof number === 'string') {
        return getNumberOrDefault(parseInt(number), defaultVal)
    } else {
        return defaultVal
    }
}