import { RequestClient } from './request-client';

export interface lcmeRequest {
    CRUD_Action: string;
    procedureAction: string;
    appID: string;
    appNameId: number;
}

export interface lcmeResponse<DATA extends object> {
    isSuccess: boolean;
    statusMessage: string;
    data: DATA;
}

export class lcmeCrudRequestClient<BASE_REQUEST_FORMAT extends lcmeRequest = lcmeRequest, BASE_RESPONSE_FORMAT extends lcmeResponse<any> = lcmeResponse<any>> extends RequestClient {

}