import { classToPlain } from 'class-transformer';
import { FilterDefinition } from 'lcme-common/lib/models/filter';
import { GenericEntityManager } from './generic-entity-manager';
import { IsInt, IsBoolean, IsString, IsInstance } from 'class-validator';
import { Type } from 'class-transformer';
import { serviceConfig } from '../config/config';
import { RequestClient } from 'lcme-services-common/lib/requests/request-client';
import { ScheduleConfigDb } from 'lcme-services-common/lib/db/schedule-config-db';
import { filterConfigDb, scheduleConfigDb } from '../globals';
import { ScheduleDefinition } from 'lcme-common/lib/models/schedule';
import { FilterValidationResponse, SequenceFilterValidationRequest } from '../models/multi-filter-validation';
import { transformAndValidate } from 'class-transformer-validator';

export class ValidateFilterRequest {
  readonly CRUD_Action = 'subProcedure';
  readonly procedureAction = 'validate';
  readonly appID = 'WTI_filterSvc';
  appNameID: number;
  tableCL: string;
  filterSQL: string;
  filterType: string;
  filterName: string;
  filterOrSort: string;

  constructor(tableCL: string, filterSQL: string, filterType: string, filterName: string, filterOrSort: string) {
    this.appNameID = serviceConfig.configApiAppNameId;
    this.tableCL = tableCL;
    this.filterSQL = filterSQL;
    this.filterType = filterType;
    this.filterName = filterName;
    this.filterOrSort = filterOrSort;
  }
}

export class MakeFilterRequest {
  readonly CRUD_Action = 'subProcedure';
  readonly procedureAction = 'create';
  readonly appID = 'WTI_filterSvc';
  appNameID: number;
  tableCL: string;
  filterSQL: string;
  filterType: string;
  filterName: string;
  redisGUID: string;
  filterOrSort: string;

  constructor(
    tableCL: string,
    filterSQL: string,
    filterType: string,
    filterName: string,
    redisGUID: string,
    filterOrSort: string
  ) {
    this.appNameID = serviceConfig.configApiAppNameId;
    this.tableCL = tableCL;
    this.filterSQL = filterSQL;
    this.filterType = filterType;
    this.filterName = filterName;
    this.redisGUID = redisGUID;
    this.filterOrSort = filterOrSort;
  }
}

export class UpdateFilterRequest {
  readonly CRUD_Action = 'subProcedure';
  readonly procedureAction = 'update';
  readonly appID = 'WTI_filterSvc';
  appNameID: number;
  tableCL: string;
  filterSQL: string;
  filterType: string;
  filterName: string;
  redisGUID: string;
  filterOrSort: string;
  filterID: number;

  constructor(
    tableCL: string,
    filterSQL: string,
    filterType: string,
    filterName: string,
    redisGUID: string,
    filterOrSort: string,
    filterID: number
  ) {
    this.appNameID = serviceConfig.configApiAppNameId;
    this.tableCL = tableCL;
    this.filterSQL = filterSQL;
    this.filterType = filterType;
    this.filterName = filterName;
    this.redisGUID = redisGUID;
    this.filterOrSort = filterOrSort;
    this.filterID = filterID;
  }
}

export class RemoveFilterRequest {
  readonly CRUD_Action = 'subProcedure';
  readonly procedureAction = 'delete';
  readonly appID = 'WTI_filterSvc';
  appNameID: number;
  filterID: number;

  constructor(filterID: number) {
    this.appNameID = serviceConfig.configApiAppNameId;
    this.filterID = filterID;
  }
}

export class MakeFilterRecord {
  @IsInt()
  filterID!: number;
}

export class MakeFilterArray {
  @IsInstance(MakeFilterRecord, {
    each: true,
  })
  returnData!: MakeFilterRecord[];
}

export class RemoveFilterRecord {
  @IsInt()
  rowsUpdated!: number;
}

export class RemoveFilterArray {
  @IsInstance(RemoveFilterRecord, {
    each: true,
  })
  returnData!: RemoveFilterRecord[];
}

export class MakeFilterResponse {
  @IsBoolean()
  isSuccess!: boolean;

  @IsString()
  statusMessage!: string;

  @Type(() => MakeFilterRecord)
  data!: MakeFilterArray;
}

export class RemoveFilterResponse {
  @IsBoolean()
  isSuccess!: boolean;

  @IsString()
  statusMessage!: string;

  @Type(() => RemoveFilterRecord)
  data!: RemoveFilterArray;
}

export class FilterConfigManager extends GenericEntityManager<FilterDefinition> {
  lcmeCrudClient: RequestClient;

  constructor() {
    super(filterConfigDb);
    this.lcmeCrudClient = new RequestClient(serviceConfig.crudApi.crudApiUrl);
  }

  async createFilterAtlcme(makeFilterRequest: MakeFilterRequest): Promise<MakeFilterResponse> {
    const headers = {
      'Content-Type': 'application/json-patch+json',
      accept: 'text/plain',
    };
    const https = serviceConfig.apiCertificate.getHttpsOptions();

    const { body }: any = await this.lcmeCrudClient.post(makeFilterRequest, headers, https);
    this.validatelcmeResponse(body);

    return body[0] as MakeFilterResponse;
  }

  async add(filter: FilterDefinition) {
    const addedFilter = await super.add(filter);
    if (serviceConfig.dev.skiplcmeCrud) {
      return addedFilter;
    }
    const makeFilterRequest = new MakeFilterRequest(
      filter.tableCL,
      filter.filterSQL,
      filter.filterType,
      filter.filterName,
      addedFilter.id,
      filter.filterOrSort
    );
    this.logger.mlog('verbose', ['makeFilterRequest:', makeFilterRequest]);
    let makeFilterResponse;
    try {
      makeFilterResponse = await this.createFilterAtlcme(makeFilterRequest);
    } catch (e) {
      this.logger.mlog('error', ['Creation of filter failed; removing from redis.', e]);
      await super.remove(addedFilter).catch((e) => this.logger.log('error', e));
      throw e;
    }
    const {
      data: {
        returnData: [{ filterID }],
      },
    } = makeFilterResponse;
    this.logger.mlog('verbose', ['makeFilterResponse:', makeFilterResponse]);
    await this.entityDb.jsonUpdate(addedFilter.id, '.filterID', filterID);
    addedFilter.filterID = filterID;
    return addedFilter;
  }

  async removeFilterInSql(removeFilterRequest: RemoveFilterRequest): Promise<RemoveFilterResponse> {
    const headers = {
      'Content-Type': 'application/json-patch+json',
      accept: 'text/plain',
    };
    const https = serviceConfig.apiCertificate.getHttpsOptions();

    const { body }: any = await this.lcmeCrudClient.post(removeFilterRequest, headers, https);
    this.validatelcmeResponse(body);

    return body[0] as RemoveFilterResponse;
  }

  async updateFilterInSql(updateFilterRequest: UpdateFilterRequest): Promise<RemoveFilterResponse> {
    const headers = {
      'Content-Type': 'application/json-patch+json',
      accept: 'text/plain',
    };
    const https = serviceConfig.apiCertificate.getHttpsOptions();
    const { body }: any = await this.lcmeCrudClient.post(updateFilterRequest, headers, https);
    this.validatelcmeResponse(body);

    return body[0] as RemoveFilterResponse;
  }

  private validatelcmeResponse(body: any) {
    if (!Array.isArray(body)) {
      this.logger.mlog('warn', ['create filter error body:', body]);
      throw new Error('Response body was unexpected format - expecting an array');
    }
    let responseError;
    body.some((filterResponse) => {
      if (!filterResponse.isSuccess) {
        responseError = filterResponse.statusMessage || 'unknown';
        return true;
      }
    });
    if (responseError) {
      this.logger.mlog('warn', ['create filter error body:', body]);
      throw new Error(`Received error response when trying to create filter: ${responseError}`);
    }
  }

  public async getDependents(filter: FilterDefinition) {
    const dependentScheduleIds = await filterConfigDb.getRelatedEntitiesOfType(
      filter.id,
      ScheduleDefinition.ENTITY_TYPE,
      {
        filterNull: true,
      }
    );
    if (!dependentScheduleIds || dependentScheduleIds.length === 0) {
      return;
    }
    const dependentSchedules = await scheduleConfigDb.mgetList(dependentScheduleIds);
    return {
      cascadeDeletable: false,
      dependents: {
        schedules: dependentSchedules.map((schedule) => {
          return {
            scheduleId: schedule.id,
            scheduleName: schedule.ScheduleName,
          };
        }),
      },
    };
  }

  public async remove(filter: FilterDefinition) {
    this.logger.mlog('debug', ['remove input filter:', filter]);
    if (!serviceConfig.dev.skiplcmeCrud) {
      const sqlRemoveFilterRequest = new RemoveFilterRequest(filter.filterID);
      this.logger.mlog('debug', ['sqlRemoveFilterRequest:', sqlRemoveFilterRequest]);
      const sqlRemoveFilterResponse = await this.removeFilterInSql(sqlRemoveFilterRequest);
      this.logger.mlog('debug', ['sqlRemoveFilterResponse:', sqlRemoveFilterResponse]);
    }
    const redisRemoveFilterResponse = await super.remove(filter);
    this.logger.mlog('debug', ['redisRemoveFilterResponse:', redisRemoveFilterResponse]);
    return redisRemoveFilterResponse;
  }

  public async update(filter: FilterDefinition) {
    this.logger.mlog('debug', ['update input filter:', filter]);
    if (!serviceConfig.dev.skiplcmeCrud) {
      const sqlUpdateFilterRequest = new UpdateFilterRequest(
        filter.tableCL,
        filter.filterSQL,
        filter.filterType,
        filter.filterName,
        filter.id,
        filter.filterOrSort,
        filter.filterID
      );
      this.logger.mlog('debug', ['sqlUpdateFilterRequest:', sqlUpdateFilterRequest]);
      const sqlUpdateFilterResponse = await this.updateFilterInSql(sqlUpdateFilterRequest);
      this.logger.mlog('debug', ['sqlUpdateFilterResponse:', sqlUpdateFilterResponse]);
    }
    const redisUpdateFilterResponse = await super.update(filter);
    this.logger.mlog('debug', ['redisUpdateFilterResponse:', redisUpdateFilterResponse]);
    return redisUpdateFilterResponse;
  }

  public async validateMultiFilter(sequenceFilterValidationRequest: SequenceFilterValidationRequest) {
    this.logger.mlog('debug', ['Performing Filter Validation Request:', sequenceFilterValidationRequest]);

    try {
      const headers = {
        'Content-Type': 'application/json-patch+json',
        accept: 'text/plain',
      };
      const https = serviceConfig.apiCertificate.getHttpsOptions();
      const response = await this.lcmeCrudClient.post(sequenceFilterValidationRequest, headers, https);
      const body = response.body;
      this.logger.mlog('debug', ['Got Raw Filter Validation Response:', body]);
      const filterValidationResponse = await transformAndValidate(FilterValidationResponse, body);
      return filterValidationResponse;
    } catch (e) {
      this.logger.mlog('error', ['Filter Validation Request Failed', e]);
      throw e;
    }
  }
}
