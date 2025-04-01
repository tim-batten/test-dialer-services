import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator"
import { isString } from "lodash"
import { DateTime, IANAZone } from "luxon"

@ValidatorConstraint({ async: false })
export class IsIANATimezoneContraint implements ValidatorConstraintInterface {

    validate(value: string | IANAZone | undefined, args: ValidationArguments) {
        return this.getInvalidReason(value) ? false : true
    }

    defaultMessage(args: ValidationArguments) {
        return this.getInvalidReason(args.value) || 'Unknown'
    }

    getInvalidReason(value: any) {
        if (!value) {
            return `Value is undefined`
        }
        if (typeof value !== 'string' && !(value instanceof IANAZone)) {
            return `Value ${value} is not a string or IANAZone`
        }
        let zone
        if (typeof value === 'string') {
            zone = new IANAZone(value)
        } else  {
            zone = value
        }
        if (!zone.isValid) {
            return `${zone.name} is not a valid IANA zone`
        }
    }
}

@ValidatorConstraint({ async: false })
export class IsValidISODateStringContraint implements ValidatorConstraintInterface {

    validate(value: string | undefined, args: ValidationArguments) {
        return this.getInvalidReason(value) ? false : true
    }

    defaultMessage(args: ValidationArguments) {
        return this.getInvalidReason(args.value) || 'Unknown'
    }

    getInvalidReason(value: any) {
        if (!value || typeof value !== 'string') {
            return `${value} is not a string`
        }
        if (value.length !== '0000-00-00'.length) {
            return `${value} is not an ISO date string (e.g. "2022-03-21")`
        }
        const isoDate = DateTime.fromISO(`${value}T00:00:00.000`)
        if (isoDate.isValid) {
            return
        }
        return isoDate.invalidExplanation ? isoDate.invalidExplanation : `${value} is not an ISO date string (e.g. "2022-03-21")`
    }
}

@ValidatorConstraint({ async: false })
export class IsValidHHMMStringConstraint implements ValidatorConstraintInterface {
  validate(value: string | undefined, args: ValidationArguments) {
    return /^\d{2}:\d{2}$/.test(value || '');
  }

  defaultMessage(args: ValidationArguments) {
    return '($value) must be in HH:MM format';
  }
}