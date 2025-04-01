import { IdObj } from './globalTypes';

export const callingModes = [
  'power',
  'agentless'
] as const;
export type CallingMode = typeof callingModes[number];

export interface ICampaignGroup {
  name: string;
}
export interface ICampaign extends IdObj {
  CampaignName: string;
  BaseConfig: IBaseConfig;
  Pacing: IPacing;
  CustomAttributes: ICustomAttributes;
}

export interface IBaseConfig {
  CallingMode: CallingMode;
  CampaignGroupId: string;
  Queue: string;
  ContactListConfigID: string;
  Callerid: string;
  ContactFlowOverride?: string;
  Weight: number;
  ActivePhoneTypes: string[];
}

export interface ICustomAttributes {
  ActiveAttributes: IActiveAttribute[];
}

export interface IActiveAttribute {
  Name: string;
  Value: string;
}

export interface IPacing {
  InitialCPAMode?: string;
  InitialCPA: number;
  MaxCPA?: number | null;
  InitialDuration: number;
  AbaIncrement: number;
  CpaModifier: number;
  AbaCalculation?: string;
  AbaTargetRate: number;
  ConcurrentCalls?: number;
}

export interface CampaignDependents {
  cascadeDeletable: boolean;
  dependents: Dependents;
}

export interface Dependents {
  schedules: Schedule[];
  scheduleExecutions: any[];
}

export interface Schedule {
  scheduleId: string;
  scheduleName: string;
}
