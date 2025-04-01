import { TransformValidationOptions } from "class-transformer-validator";
import { ValidationOptions, ValidatorOptions } from "class-validator";
import { ClassTransformOptions } from "class-transformer";

export const defaultCRUDValidatorOptions: ValidatorOptions = {
  forbidUnknownValues: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

export const defaultCRUDTransformerOptions: ClassTransformOptions = {};

export const defaultCRUDTransformValidationOptions: TransformValidationOptions =
  {
    validator: defaultCRUDValidatorOptions,
    transformer: defaultCRUDTransformerOptions,
  };

export const defaultConfigValidatorOptions: ValidatorOptions = {
  forbidUnknownValues: true,
  whitelist: false,
  forbidNonWhitelisted: false,
};

export const defaultConfigTransformerOptions: ClassTransformOptions = {};

export const defaultConfigTransformValidationOptions: TransformValidationOptions =
  {
    validator: defaultConfigValidatorOptions,
    transformer: defaultConfigTransformerOptions,
  };

export const AllGroupValidateOption = {
  always: true,
};
