export function envGetStringOrDefault(envVarName: string, defaultValue: string) {
    const valueStr = process.env[envVarName]
    if (!valueStr) {
        return defaultValue
    }
    return valueStr
}

export function envGetString(envVarName: string) {
   return process.env[envVarName]
}

export function envGetNumberOrDefault(envVarName: string, defaultValue: number) {
    const numberFromEnv = envGetNumber(envVarName)
    return numberFromEnv ? numberFromEnv : defaultValue
}

export function envGetNumber(envVarName: string) {
    const stringFromEnv = process.env[envVarName]
    if (!stringFromEnv) {
        return undefined
    }
    const valueStr = stringFromEnv
    const toReturn = parseInt(valueStr)
    if (!toReturn) {
        return undefined
    }
    return toReturn
}