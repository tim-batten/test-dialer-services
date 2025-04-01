import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    IsInstance,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested
} from 'class-validator';
import { CampaignExecutionDefinition } from 'navient-common/lib/models/campaign-execution';
import { getHHMMTimeString } from 'navient-common/lib/utils/date-helper'
import { serviceConfig } from '../config/config';

type FilterPhoneColumn = {
    phoneColumn: string
}
type FilterID = {
    filterID: string
}
type OrderById = {
    orderBy_ID: string,
    orderBy_Type?: string
}

export class CacheBuildRequest {
    readonly CRUD_Action = 'subProcedure'
    readonly procedureAction = 'buildCache'
    readonly appNameID = serviceConfig.cacheBuildAppNameId
    readonly appID = 'WTI_cacheSvc'
    readonly dbSchema = 'dbo'
    readonly isUAT = 0

    campaignEventID: string
    campaignID: string
    campaignName: string
    postbackURL: string
    tableCL: string
    tablePND: string
    tableDNC: string
    eventStartTime: string
    eventEndTime: string
    filterPhoneColumns: FilterPhoneColumn[]
    filterIDs: FilterID[]
    orderBy_IDs: OrderById[]

    constructor(campaignExecution: CampaignExecutionDefinition, postbackURL: string) {
        this.campaignEventID = campaignExecution.id
        this.campaignID = campaignExecution.campaign.id
        this.campaignName = campaignExecution.campaign.CampaignName
        const contactList = campaignExecution.contactList
        this.tableCL = contactList.ContactListTable
        this.tablePND = contactList.PhoneListTable
        this.tableDNC = contactList.DncTable
        const scheduleOccurrenceStartTime = campaignExecution.scheduleOccurrenceStartTime
        const scheduleOccurrenceEndTime = campaignExecution.getEndByDate()
        this.eventStartTime = getHHMMTimeString(scheduleOccurrenceStartTime, serviceConfig.crudApi.crudApiTimezone)
        this.eventEndTime = getHHMMTimeString(scheduleOccurrenceEndTime, serviceConfig.crudApi.crudApiTimezone)
        this.filterPhoneColumns = campaignExecution.phones.map((phoneColumn) => {
            return {
                phoneColumn
            }
        })
        this.filterIDs = campaignExecution.filters.map((filter) => {
            return {
                filterID: ''+filter.filterId
        }})

        this.orderBy_IDs = campaignExecution.sorts.map((sort) => {
            return {
                orderBy_ID: ''+sort.orderById,
                orderBy_Type: sort.orderByType            
            }
        })
        this.postbackURL = postbackURL
    }
}

export class CacheBuildResponseReturnData {
    @IsNumber()
    cache_eventActions_ID!: number
}

export class CacheBuildResponseData {
    @IsOptional()
    @IsString()
    CRUD_Action!: string

    @IsOptional()
    @IsBoolean()
    isUAT!: boolean

    @IsOptional()
    @IsString()
    procedureAction!: string

    @IsOptional()
    @IsNumber()
    appNameID!: number
    
    @IsOptional()
    @ValidateNested()
    @IsInstance(CacheBuildResponseReturnData)
    @Type(() => CacheBuildResponseReturnData)
    returnData!: CacheBuildResponseReturnData[]
}

export class CacheBuildResponse {
    @IsBoolean()
    isSuccess!: boolean

    @IsString()
    statusMessage!: string

    @ValidateNested()
    @IsInstance(CacheBuildResponseData)
    @Type(() => CacheBuildResponseData)
    data!: CacheBuildResponseData
}

export class CacheBuildPostbackData {
    @IsInt()
    cache_eventActions_ID!: number

    @IsInt()
    cachedRecords!: number

    @IsInt()
    timeWindow_callableRecords!: number

    @IsBoolean()
    isSuccessful!: boolean
}

export class CacheBuildPostback {
    @IsBoolean()
    isSuccess!: boolean

    @IsString()
    statusMessage!: string

    @IsInstance(CacheBuildPostbackData)
    @Type(() => CacheBuildPostbackData)
    data!: CacheBuildPostbackData
}