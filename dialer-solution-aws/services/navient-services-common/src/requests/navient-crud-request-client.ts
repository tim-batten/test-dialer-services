import { RequestClient } from './request-client';

export interface NavientRequest {
    CRUD_Action: string;
    procedureAction: string;
    appID: string;
    appNameId: number;
}

export interface NavientResponse<DATA extends object> {
    isSuccess: boolean;
    statusMessage: string;
    data: DATA;
}

export class NavientCrudRequestClient<BASE_REQUEST_FORMAT extends NavientRequest = NavientRequest, BASE_RESPONSE_FORMAT extends NavientResponse<any> = NavientResponse<any>> extends RequestClient {

}