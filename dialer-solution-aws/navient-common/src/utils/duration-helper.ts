import parse, { Units } from 'parse-duration'

export enum InputUnit {
    MILLISECOND = 1,
    SECOND = MILLISECOND * 1000,
    MINUTE = SECOND * 60,
    HOUR = MINUTE * 60,
    DAY = HOUR * 24,
    WEEK = DAY * 7
}

export function parseDuration(defaultInputUnit: InputUnit, outputUnit: Units, input: string | number) {
    if (typeof input === 'number') {
        input *= defaultInputUnit
    } else {
        if (input.match('/[\-0-9\.]*/')) {
            input = parseInt(input) * defaultInputUnit
        }
    }
    return parse(''+input, outputUnit)
}