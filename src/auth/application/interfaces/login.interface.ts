export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SessionUserRole {
  id: string;
  name: string;
}

export interface SessionUserArea {
  id: string;
  name: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  companyId: string;
  areaId: string;
  area: SessionUserArea;
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
  area: {
    id: string;
    name: string;
  };
}

export interface LoginResult {
  accessToken: string;
  user: SessionUser;
}
