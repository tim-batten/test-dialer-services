import { ServiceRole } from 'navient-common/lib/types/roles';

export class TokenInfo {
  constructor(
    public readonly token: string,
    public expiration: Date,
    public readonly dlr_role: ServiceRole[],
    public readonly userId: string,
    public readonly userName: string
  ) {}

  public isExpiredAt(date: Date) {
    return this.expiration < date;
  }

  public hasRole(...serviceRoles: ServiceRole[]) {
    return serviceRoles.find((serviceRole) => this.dlr_role.includes(serviceRole)) ? true : false;
  }
}
