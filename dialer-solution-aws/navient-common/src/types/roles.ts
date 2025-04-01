export enum ServiceRole {
  ADMINISTRATOR = 'wti.administrator',
  DEVELOPER = 'wti.developer',
  ANALYST = 'wti.analyst',
  READ_ONLY = 'wti.read_only',
}

export const ALL_SERVICE_ROLES = [
  ServiceRole.ADMINISTRATOR,
  ServiceRole.DEVELOPER,
  ServiceRole.ANALYST,
  ServiceRole.READ_ONLY,
];

export type RolesApiResponse = {
    roles: ServiceRole[],
    authEnabled: boolean,
}