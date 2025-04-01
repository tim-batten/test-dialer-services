export interface IOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface IDateRange {
  start: Date;
  end: Date;
}

export const isIOption = (value: string | IOption): value is IOption => {
  return (value as IOption)?.value !== undefined;
};

export interface ICallBackMessage {
  code: string;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export interface IAccounts {
  /** Short Code for the account */
  shortCode: string;
  /** Host url for the account */
  url: string;
  /** Account Name */
  name: string;
  /** Color to represent the account, this can be used as an indicator for the calendar */
  color: string;
}
export type TSeverity = 'success' | 'error' | 'warning' | 'info';
