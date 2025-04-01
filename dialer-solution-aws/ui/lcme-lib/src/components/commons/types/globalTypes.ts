export interface IdObj {
  id?: string;
}

export interface IGlobalConfig {
  Connect: IConnect;
  DialerDefaults: IDialerDefaults;
}

export interface IConnect {
  AwsRegion: string;
  InstanceArn: string;
  ConnectProjectCPS: number;
}

export interface IDialerDefaults {
  ScheduleTimezone: string;
  ContactFlowId: string;
  MaxCPA: number;
  InitialCpaMin: number;
  InitialCpaMax: number;
  InitialPacingDurationMin: number;
  InitialPacingDurationMax: number;
  InitialPacingSamplesMin: number;
  InitialPacingSamplesMax: number;
  AbandonmentIncrementMin: number;
  AbandonmentIncrementMax: number;
  CpaModifierMin: number;
  CpaModifierMax: number;
  AbaTargetRateMin: number;
  AbaTargetRateMax: number;
  CallLimitRecordMin: number;
  CallLimitRecordMax: number;
  CallLimitPhoneMin: number;
  CallLimitPhoneMax: number;
  ScheduleLoopsMin: number;
  ScheduleLoopsMax: number;
  ConcurrentCallsMin: number;
  ConcurrentCallsMax: number;
}
