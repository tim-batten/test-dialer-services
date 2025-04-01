import { Type } from 'class-transformer';
import { IsInstance, IsInt, IsString, Validate, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { IANAZone } from 'luxon';
import { CampaignDefinition } from 'lcme-common/lib/models/campaign';
import { ContactListDefinition } from 'lcme-common/lib/models/contact-list';
import { FilterDefinition } from 'lcme-common/lib/models/filter';
import { getHHMMTimeString } from 'lcme-common/lib/utils/date-helper';
import { IsIANATimezoneContraint, IsValidHHMMStringConstraint } from 'lcme-common/lib/validation/time-validation';
import { serviceConfig } from '../config/config';

export class IncomingFilterValidationRequest {
  @IsString()
  campaignId!: string;

  @IsString({ each: true })
  phones!: string[];

  @IsString({
    each: true,
    message: 'Must be a list containing filter keys (e.g. {namespace:filter}:1)',
  })
  filterIds!: string[];

  @Validate(IsValidHHMMStringConstraint)
  startTime!: string;

  @Validate(IsValidHHMMStringConstraint)
  endTime!: string;

  @Validate(IsIANATimezoneContraint)
  @IsOptional()
  timezone?: IANAZone;

  //TODO: Remove this, it's very useful for testing but is unnecessary in prod
  @IsString()
  @IsOptional()
  userIdOverride?: string;
}

export const generateSequenceFilterValidationRequest = (
  appNameID: number,
  campaign: CampaignDefinition,
  contactList: ContactListDefinition,
  phones: string[],
  filters: FilterDefinition[],
  startTime: Date,
  endTime: Date,
  delayTest?: number,
  isUAT: boolean = false
) => {
  const filterPhoneColumns = phones.map((phone) => ({
    phoneColumn: phone,
  }));
  const filterIDs = filters.map((filter) => ({
    filterID: filter.filterID,
  }));

  const eventStartTime = getHHMMTimeString(startTime, serviceConfig.crudApi.crudApiTimezone);
  const eventEndTime = getHHMMTimeString(endTime, serviceConfig.crudApi.crudApiTimezone);

  return {
    CRUD_Action: 'subProcedure',
    procedureAction: 'validate',
    dbSchema: 'dbo',
    appID: 'WTI_campaignFilterValidation',
    appNameID,
    isUAT: isUAT ? 1 : 0,
    campaignID: campaign.id,
    campaignName: campaign.CampaignName,
    tableCL: contactList.ContactListTable,
    tablePND: contactList.PhoneListTable,
    tableDNC: contactList.DncTable,
    eventStartTime,
    eventEndTime,
    filterPhoneColumns,
    filterIDs,
    delayTest: (delayTest || 0) > 0 ? delayTest : undefined,
  };
};

export type SequenceFilterValidationRequest = ReturnType<typeof generateSequenceFilterValidationRequest>;

export class PhoneColumn {
  @IsString()
  Phone_Column!: string;
  @IsInt()
  Phone_Total!: number;
  @IsInt()
  Phones_Callable!: number;
  @IsInt()
  Phones_Callable_forCampaignTime!: number;
}

export class FilterValidationResponseData {
  @IsInt()
  Consumers_total!: number;
  @IsInt()
  Phones_Total!: number;
  @IsInt()
  Phones_Callable_Today!: number;
  @IsInt()
  Phones_Callable_forCampaignTime!: number;

  @ValidateNested()
  @IsInstance(PhoneColumn, {
    each: true,
  })
  @Type(() => PhoneColumn)
  Phone_Columns!: PhoneColumn[];
}

export class FilterValidationResponse {
  @IsBoolean()
  isSuccess!: boolean;

  @IsString()
  statusMessage!: string;

  @ValidateNested()
  @IsInstance(FilterValidationResponseData)
  @Type(() => FilterValidationResponseData)
  data!: FilterValidationResponseData;
}

export const generateDummyFilterValidationResponse = (phoneCols: string[]): FilterValidationResponseData => {
  const phoneColumns = phoneCols.map((phoneCol) => {
    const totalCallable = Math.floor(Math.random() * 1000);
    const totalCallableToday = Math.floor(Math.random() * totalCallable);
    const totalCallableForCampaignTime = Math.floor(Math.random() * totalCallableToday);
    return {
      Phone_Column: phoneCol,
      Phone_Total: totalCallable,
      Phones_Callable: totalCallableToday,
      Phones_Callable_forCampaignTime: totalCallableForCampaignTime,
    };
  });
  const { Phones_Total, Phones_Callable_Today, Phones_Callable_forCampaignTime } = phoneColumns.reduce(
    (acc, curr) => {
      acc.Phones_Total += curr.Phone_Total;
      acc.Phones_Callable_Today += curr.Phones_Callable;
      acc.Phones_Callable_forCampaignTime += curr.Phones_Callable_forCampaignTime;
      return acc;
    },
    { Phones_Total: 0, Phones_Callable_Today: 0, Phones_Callable_forCampaignTime: 0 }
  );
  return {
    Consumers_total: 1000,
    Phones_Total,
    Phones_Callable_Today,
    Phones_Callable_forCampaignTime,
    Phone_Columns: phoneColumns,
  };
};
