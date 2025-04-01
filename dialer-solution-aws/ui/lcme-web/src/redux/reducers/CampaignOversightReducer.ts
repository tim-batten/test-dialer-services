import {
  GET_SCHEDULE_EXECUTIONS,
  CONTROL_SCHEDULE_EXECUTION,
} from "../actions/CampaignOversightActions";
import { OversightStats } from 'lcme-common/lib/types/oversight-stats';

export interface CampaignOversightState {
  scheduleExecutions: OversightStats[];
  didSucceed: boolean;
}

const initialState: CampaignOversightState = {
  scheduleExecutions: [],
  didSucceed: false,
};

export default function reduce(state = initialState, action) {
  switch (action.type) {
    case `${GET_SCHEDULE_EXECUTIONS}_FULFILLED`:
      state = {
        ...state,
        scheduleExecutions: action.payload.data,
      };
      break;
    case `${GET_SCHEDULE_EXECUTIONS}_REJECTED`:
      state = {
        ...state,
      };
      break;

    case `${CONTROL_SCHEDULE_EXECUTION}_FULFILLED`:
      state = {
        ...state,
        didSucceed: true,
      };
      break;

    case `${CONTROL_SCHEDULE_EXECUTION}_REJECTED`:
      state = {
        ...state,
        didSucceed: false,
      };
      break;

    default:
      break;
  }

  return state;
}
