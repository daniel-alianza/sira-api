export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SessionUserRole {
  id: string;
  name: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  companyId: string;
  areaId: string;
  role: SessionUserRole;
}

export interface AuthUserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  roleId: string;
  role: SessionUserRole;
  companyId: string;
  areaId: string;
  branchId: string;
  isActive: boolean;
}

export interface LoginResult {
  accessToken: string;
  user: SessionUser;
}
