import { IdObj } from './globalTypes';

export interface IContactList extends IdObj {
  ContactListConfigName: string;
  ContactListTable: string;
  DncIdentifier: string;
  DncTable: string;
  PhoneListTable: string;
  PhoneTypes: string[];
  Compliance: ICompliance;
}

export interface ICompliance {
  DailyCallLimitRecord: number;
  DailyCallLimitPhone: number;
}
