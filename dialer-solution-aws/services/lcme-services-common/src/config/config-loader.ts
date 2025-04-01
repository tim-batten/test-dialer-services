import fs from 'fs'
import { exit } from 'process'
import YAML from 'yaml'
import { mergeObjects } from '../utils/object-helper'
import { getPlainDbConfFromEnv } from './db-config'

function getConfigPlain(configFileName: string) {
    let configString
    let configPlain
    configString = fs.readFileSync(configFileName).toString()
    if (configString) {
        configPlain = YAML.parse(configString)
    } else {
        configPlain = {}
    }
    return configPlain
}

export function loadConfigObject(componentKey: string, includeDb: boolean) {
    const configEnv = process.env.CONFIG_ENV
    let configPrefix = ''
    if (configEnv) {
        configPrefix = configEnv + '.'
    }
    let globalLoadError
    const globalFileName = '../global-config/' + configPrefix + 'global-config.yaml'
    let globalConfigPlain: any = {}
    try {
        globalConfigPlain = getConfigPlain(globalFileName)
    } catch (e: any) {
        globalLoadError = e.message
    }
    if (globalConfigPlain && globalConfigPlain[componentKey]) {
        const globalConfigComponentSpecific = globalConfigPlain[componentKey]
        delete globalConfigPlain[componentKey]
        globalConfigPlain = { ...globalConfigPlain, ...globalConfigComponentSpecific }
    }
    const localConfigFilename = 'config/' + configPrefix + 'config.yaml'
    let localConfigPlain: any = {}
    try {
        localConfigPlain = getConfigPlain(localConfigFilename)
    } catch (e: any) {
        if (globalLoadError) {
            console.error(`Unable to load global config (${globalFileName}: ${globalLoadError}`)
            console.error(`Unable to load local config ${localConfigFilename}: ${e.message}`)
            console.error('At least one of these files must be present, readable and parseable')
            exit()
        }
    }
    const configPlain = { ...globalConfigPlain, ...localConfigPlain }
    if (includeDb) {
        const dbFromEnv = getPlainDbConfFromEnv()
        configPlain['db'] = mergeObjects(configPlain['db'], dbFromEnv)
    }
    return configPlain
}

export function getConfigFromEnv(...keys: string[]) {
    const toReturn: {[key: string]: any} = {}
    keys.forEach((key) => {
        const envVal = process.env[key]
        if (envVal) {
            toReturn[key] = envVal
        }
    })
    return toReturn
}
