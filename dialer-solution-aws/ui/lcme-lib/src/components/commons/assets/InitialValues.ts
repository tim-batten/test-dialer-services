import { FastRewind } from '@material-ui/icons';
import {
  toDateString,
  toTime,
  toTimeEnd,
  toTimeStart,
} from '../utils/DateFormatter';

export const campaignFormInitialValues = (dialerDefaults) => {

  return ({
    campaignConfigName: 'Campaign Name',
    callingMode: '',
    group: '',
    queue: '',
    contactList: '',
    defaultCallerID: '',
    contactFlowOverride: '',
    weight: 0,
    activePhoneFields: [],
    initialCpaMode: 'none',
    initialCallsPerAgent: 0,
    maxPerAgent: dialerDefaults?.MaxCPA,
    initialPacing: 0,
    aBAIncrement: 0,
    cPAModifier: 0,
    aBACalculation: 'none',
    aBATargetRate: 0,
    concurrentCalls: 0,
    customAttributes: [],
  })
};

export const campaignOversightFormInitialValues = {
  initialCallsPerAgent: 0,
  initialCpaMode: 'none',
  initialPacing: 0,
  aBAIncrement: 0,
  cPAModifier: 0,
  aBACalculation: 'none',
  aBATargetRate: 0,
  weight: 0,
  concurrentCalls: 0,
  endTime: toTime(new Date()),
};

export const contactListInitialValues = {
  contactListConfigId: '',
  contactListConfigName: 'Contact List Name',
  contactListTable: '',
  phoneListTable: '',
  doNotCallTable: '',
  dncUniqueRecordIdentifier: '',
  phoneTypes: '',
  dailyCallLimitRecord: 0,
  dailyCallLimitPhone: 0,
};

export const configFormInitialValues = {
  awsRegion: '',
  instanceArn: '',
  connectProjectCPS: 1,
  scheduleTimezone: 'none',
  contactFlowId: '',
  abandonmentIncrementMin: 1,
  abandonmentIncrementMax: 100,
  cpaModifierMin: 1,
  cpaModifierMax: 100,
  abaTargetRateMin: 1,
  abaTargetRateMax: 100,
  concurrentCallsMin: 1,
  concurrentCallsMax: 100,
  maxCpa: 1,
  initialCpa: [1, 50],
  initialPacingDurationMin: 1,
  initialPacingDurationMax: 100,
  initialPacingSamplesMin: 1,
  initialPacingSamplesMax: 100,
  callLimitRecord: [1, 25],
  callLimitPhone: [1, 25],
  scheduleLoops: [1, 50],
};
export type ConfigFormValues = typeof configFormInitialValues;

export const filterSortInitialValues = {
  filterName: 'Filter Name',
  tableCL: '',
  filterOrSort: 'none',
  filterType: 'none',
  sqlInput: 'none',
  filterSQL: '',
  contactOrder: '',
  currentSQL: false,
};

export const scheduleInitialValues = (timeZone) => {
  return {
    scheduleConfigName: 'Schedule Name',
    timeZone: !timeZone || timeZone === 'Eastern' ? 'EST' : timeZone,
    doesEnd: true,
    startDate: toDateString(new Date()),
    startTime: toTimeStart(new Date()),
    endTime: toTimeEnd(new Date()),
    endDate: toDateString(new Date()),
    recurrence: { type: 'doesNotRepeat', value: 1, misc: '' },
    campaign: '',
    // campaignMode: '',
    scheduleLoops: 1,
    sequences: [],
    isHoliday: false,
    isEnabled: false,
  };
};

export const holidayInitialValues = {
  holidayConfigName: 'Holiday Name',
  date: toDateString(new Date()),
  repeatAnnually: false,
};

export const dialerDefaultsConfigInitialValues = {
  ScheduleTimezone: '',
  ContactFlowId: '',
  MaxCPA: 1,
  InitialCpaMin: 1,
  InitialCpaMax: 50,
  InitialPacingDurationMin: 1,
  InitialPacingDurationMax: 1000,
  InitialPacingSamplesMin: 2,
  InitialPacingSamplesMax: 1000,
  AbandonmentIncrementMin: 0,
  AbandonmentIncrementMax: 3,
  CpaModifierMin: 0,
  CpaModifierMax: 5,
  AbaTargetRateMin: 1,
  AbaTargetRateMax: 9,
  ConcurrentCallsMin: 1,
  ConcurrentCallsMax: 1000,
  CallLimitRecordMin: 1,
  CallLimitRecordMax: 10,
  CallLimitPhoneMin: 1,
  CallLimitPhoneMax: 10,
  ScheduleLoopsMin: 1,
  ScheduleLoopsMax: 50,
};

export const ConnectInitialValues = {
  AwsRegion: '',
  InstanceArn: '',
  ConnectProjectCPS: 1
};

export const dialerDefaultsInitialValues = {
  scheduleTimezone: '',
  contactFlowId: '',
  abandonmentIncrementMin: 1,
  abandonmentIncrementMax: 100,
  cpaModifierMin: 1,
  cpaModifierMax: 97,
  abaTargetRateMin: 1,
  abaTargetRateMax: 100,
  concurrentCallsMin: 1,
  concurrentCallsMax: 1500,
  maxCpa: 1,
  initialCpaMin: 1,
  initialCpaMax: 50,
  initialPacingDurationMin: 1,
  initialPacingDurationMax: 1500,
  initialPacingSamplesMin: 1000,
  initialPacingSamplesMax: 1500,
  callLimitRecordMin: 1,
  callLimitRecordMax: 25,
  callLimitPhoneMin: 1,
  callLimitPhoneMax: 25,
  scheduleLoopsMin: 1,
  scheduleLoopsMax: 50,
};

export interface ICampaignsClass {
  campaignConfigName: string;
  callingMode: string;
  group: string;
  queue: string;
  contactList: string;
  defaultCallerID: string;
  contactFlowOverride?: string;
  weight: number;
  activePhoneFields: any[];
  initialCpaMode?: string;
  initialCallsPerAgent: number;
  maxPerAgent?: number;
  initialPacing: number;
  aBAIncrement: number;
  cPAModifier: number;
  aBACalculation?: string;
  aBATargetRate: number;
  concurrentCalls?: number;
  customAttributes: ICustomAttributes[];
}

export interface IContactListsClass {
  contactListConfigName: string;
  contactListTable: string;
  phoneListTable: string;
  doNotCallTable: string;
  dncUniqueRecordIdentifier: string;
  phoneTypes: string;
  dailyCallLimitRecord: number;
  dailyCallLimitPhone: number;
}

export interface ICustomAttributes {
  name: string;
  value: string;
}

export interface IFilterClass {
  filterName: string;
  tableCL: string;
  filterOrSort: string;
  filterType: string;
  filterSQL: string;
  sqlInput: string;
}
