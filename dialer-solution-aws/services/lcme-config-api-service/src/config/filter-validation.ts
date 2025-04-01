import { IsBoolean, IsInstance, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { InputUnit } from 'lcme-common/lib/utils/duration-helper';
import { Type } from 'class-transformer';
import { TransformDuration } from './transform-duration';

export class FilterValidationConcurrencyConfig {
  @IsBoolean()
  @IsOptional()
  enabled = true;

  @TransformDuration(InputUnit.SECOND, 'second')
  @IsInt()
  @IsOptional()
  ttl: number = 600;
}

export class FilterValidationConfig {
  @IsInt()
  @IsOptional()
  appNameId: number = 2;

  @ValidateNested()
  @IsInstance(FilterValidationConcurrencyConfig)
  @Type(() => FilterValidationConcurrencyConfig)
  userConcurrency: FilterValidationConcurrencyConfig = new FilterValidationConcurrencyConfig();

  @ValidateNested()
  @IsInstance(FilterValidationConcurrencyConfig)
  @Type(() => FilterValidationConcurrencyConfig)
  contactListConcurrency: FilterValidationConcurrencyConfig = new FilterValidationConcurrencyConfig();
}