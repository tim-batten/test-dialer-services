import { PhoneNumberInfo } from 'navient-common/lib/types/phone-numbers';
import { serviceConfig } from '../config/config';
import {
  NavientCrudRequestClient,
  NavientResponse,
} from 'navient-services-common/lib/requests/navient-crud-request-client';
import { IsBoolean, IsInstance, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { transformAndValidate } from 'class-transformer-validator';

const requestClient = new NavientCrudRequestClient(serviceConfig.crudApi.crudApiUrl);

class CrudPhoneNumberResponseData {
  @IsString()
  callerID!: string;

  @IsString()
  friendlyName!: string;
}

class CrudPhoneNumberResponse implements NavientResponse<CrudPhoneNumberResponseData[]> {
  @IsBoolean()
  isSuccess!: boolean;

  @IsString()
  statusMessage!: string;

  @IsInstance(CrudPhoneNumberResponseData, {
    each: true,
  })
  @Type(() => CrudPhoneNumberResponseData)
  data!: CrudPhoneNumberResponseData[];
}

export const mapPhoneNumbers = async (phoneNumbers: string[]): Promise<PhoneNumberInfo[]> => {
    return phoneNumbers.map((phoneNumber) => ({
      callerID: phoneNumber,
      friendlyName: phoneNumber,
    }));
//   if (serviceConfig.dev.skipNavientCrud) {
//     return phoneNumbers.map((phoneNumber) => ({
//       callerID: phoneNumber,
//       friendlyName: phoneNumber,
//     }));
//   }
//   const response = await requestClient.post(
//     {
//       crud_Action: 'subProcedure',
//       procedureAction: 'callerID',
//       appID: 'WTI_callerIdSvc',
//       appNameId: serviceConfig.configApiAppNameId,
//       callerIDs: phoneNumbers,
//     },
//     {
//       'Content-Type': 'application/json-patch+json',
//     },
//     serviceConfig.apiCertificate.getHttpsOptions(),
//     false
//   );
//   const result = (await transformAndValidate(CrudPhoneNumberResponse, response.body));
//   return Array.isArray(result) ? result.reduce((acc: CrudPhoneNumberResponseData[], cur) => acc.concat(cur.data), []) : result.data;
};
