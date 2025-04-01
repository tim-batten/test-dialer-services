import { MultiAccountConfig } from '../window-env';

export type PrjAccd<T> = T & {
    prjacc?: MultiAccountConfig;
}