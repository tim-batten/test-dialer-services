export enum ServiceRole {
  ADMINISTRATOR = "connect.administrator",
  DEVELOPER = "connect.developer",
  ANALYST = "connect.analyst",
  READ_ONLY = "connect.read_only",
}

export const ALL_SERVICE_ROLES = [
  ServiceRole.ADMINISTRATOR,
  ServiceRole.DEVELOPER,
  ServiceRole.ANALYST,
  ServiceRole.READ_ONLY,
];

export type RolesApiResponse = {
  roles: ServiceRole[];
  authEnabled: boolean;
};
