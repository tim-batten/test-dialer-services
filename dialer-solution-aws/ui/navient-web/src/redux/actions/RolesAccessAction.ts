import { getRoles as getRolesAccess } from "@navient/common";

export const GET_ROLES = "GET_ROLES";
export function getRoles() {
  return {
    type: GET_ROLES,
    /** you can call api here */
    payload: getRolesAccess(),
  };
}
