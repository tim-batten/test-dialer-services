import { AccessRoles } from '@lcme/common';
import { GET_ROLES } from '../actions/RolesAccessAction';
import { RolesApiResponse, ServiceRole } from 'lcme-common/lib/types/roles';

export interface RolesAccessState {
  role: AccessRoles;
  pending: boolean;
  authEnabled?: boolean;
}

const initialState: RolesAccessState = {
  pending: true,
  role: AccessRoles.READ_ONLY,
};

export default function reduce(state = initialState, action) {
  switch (action.type) {
    case `${GET_ROLES}_FULFILLED`:
      const data = action.payload.data as RolesApiResponse;
      const roles = data.roles || [];
      const role = roles.includes(ServiceRole.ADMINISTRATOR)
        ? AccessRoles.ADMINISTRATOR
        : roles.includes(ServiceRole.DEVELOPER)
        ? AccessRoles.DEVELOPER
        : roles.includes(ServiceRole.ANALYST)
        ? AccessRoles.ANALYST
        : roles.includes(ServiceRole.READ_ONLY)
        ? AccessRoles.READ_ONLY
        : AccessRoles.NONE;
      state = {
        ...state,
        role,
        pending: false,
        authEnabled: data.authEnabled,
      };
      break;
    case `${GET_ROLES}_PENDING`:
      state = {
        ...state,
        pending: true,
        role: AccessRoles.NONE,
      };
      break;
    case `${GET_ROLES}_REJECTED`:
      state = {
        ...state,
        pending: false,
        role: AccessRoles.NONE,
      };
      break;
    default:
      break;
  }

  return state;
}
