export interface UserPublic {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  companyId: string;
  areaId: string;
  branchId: string;
  roleId: string;
}

export interface UserFilter {
  companyId?: string;
  areaId?: string;
  branchId?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  companyId?: string;
  areaId?: string;
  branchId?: string;
  roleId?: string;
  isActive?: boolean;
}
