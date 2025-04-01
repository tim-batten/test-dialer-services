import { IdObj } from './globalTypes';

export interface IFilter extends IdObj {
  filterName: string;
  tableCL: string;
  filterSQL: string;
  filterType: string;
  filterOrSort: string;
}
