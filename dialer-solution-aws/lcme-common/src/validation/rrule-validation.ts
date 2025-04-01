import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { Frequency, RRule } from "rrule";

@ValidatorConstraint({ async: false })
class IsTooFrequentContraint implements ValidatorConstraintInterface {

    validate(value: RRule, args: ValidationArguments) {
        const maxFreq = args.constraints[0] as number
        return (value.options.freq <= maxFreq)
    }

    defaultMessage(args: ValidationArguments) {
        return `RRule has frequency of ${Frequency[args.value.options.freq]} - max frequency is ${Frequency[args.constraints[0]]}`
    }


}

export function RRuleMaxFrequency(maxFreq: Frequency, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            constraints: [maxFreq],
            options: validationOptions,
            validator: IsTooFrequentContraint
        })
    }
}

