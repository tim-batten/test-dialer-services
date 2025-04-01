import { ApiStatus } from 'navient-common/lib/types/api-status';
import { GET_API_STATUS } from '../actions/StatusActions';

export interface ApiStatusState {
    status?: ApiStatus;
    error?: any;
    loading: boolean;
}

export const initialState: ApiStatusState = {
    loading: false,
};

export const apiStatusReducer = (state = initialState, action) => {
    switch(action.type) {
        case `${GET_API_STATUS}_PENDING`: {
            state = {
                ...state,
                status: undefined,
                error: undefined,
                loading: true,
            };
            break;
        }
        case `${GET_API_STATUS}_FULFILLED`: {
            state = {
                ...state,
                status: action.payload,
                loading: false,
            };
            break;
        }
        case `${GET_API_STATUS}_REJECTED`: {
            state = {
                ...state,
                error: action.payload,
                loading: false,
            };
            break;
        }
    }
    return state;
};