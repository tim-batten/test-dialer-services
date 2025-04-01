import { IdObj } from './globalTypes';

export interface IHoliday extends IdObj {
  HolidayName: string;
  Date: string;
  RepeatAnnually: boolean;
}

export interface IHolidayID {
  HolidayName: string;
  Date: string;
  RepeatAnnually: boolean;
  id: string;
}

export interface IFormHoliday {
  holidayConfigName: string;
  date: string;
  repeatAnnually: boolean;
}
