export interface RegisterInterface {
  id?: string;
  name: string;
  email: string;
  password?: string;
  companyId: string;
  areaId: string;
  branchId: string;
  roleId?: string;
  isActive?: boolean;
}
