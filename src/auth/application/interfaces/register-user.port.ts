import type { RegisterInterface } from './register.interface';

export interface CreateUserPayload extends RegisterInterface {
  hashedPassword: string;
  roleId: string;
}

export interface RegisterUserRepositoryPort {
  findByEmail(email: string): Promise<{ id: string } | null>;
  findRoleByName(name: string): Promise<{ id: string } | null>;
  validateOrganizationIds(
    companyId: string,
    areaId: string,
    branchId: string,
  ): Promise<void>;
  create(payload: CreateUserPayload): Promise<RegisterInterface>;
}

export const REGISTER_USER_REPOSITORY = Symbol('REGISTER_USER_REPOSITORY');
