import { Units } from 'parse-duration';
import { InputUnit, parseDuration } from 'navient-common/lib/utils/duration-helper';
import { Transform } from 'class-transformer';

// this is a duplicate of code from navient-services-common/lib/validation/transform-duration.ts
// importing it from there skips the transformation step and I'm unsure why

export function TransformDuration(defaultInputUnit: InputUnit, outputUnit: Units) {
  return Transform(({ value }) => parseDuration(defaultInputUnit, outputUnit, value), { toClassOnly: true });
}
