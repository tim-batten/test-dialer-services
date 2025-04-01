import got, { HTTPSOptions, Response, Headers } from 'got';
import { Logger } from '../logger/logger';
import { ClassConstructor } from 'class-transformer';
import { transformAndValidate } from 'class-transformer-validator';

export class RequestClient<BASE_REQUEST_FORMAT extends object = object, BASE_RESPONSE_FORMAT = object> {
  logger = Logger.getLogger();

  constructor(private readonly url: string) {}

  async post<REQUEST_TYPE extends BASE_REQUEST_FORMAT, RESPONSE_TYPE extends BASE_RESPONSE_FORMAT>(
    requestBody: REQUEST_TYPE,
    headers: Headers,
    https: HTTPSOptions,
    throwHttpErrors: boolean = true
  ) {
    const response: Response<RESPONSE_TYPE> = await got.post<RESPONSE_TYPE>(this.url, {
      json: requestBody,
      headers,
      responseType: 'json',
      https,
      throwHttpErrors,
    });
    return response;
  }
}
