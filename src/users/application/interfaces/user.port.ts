import type { UpdateUserInput, UserFilter, UserPublic } from './user.interface';

export interface UpdateUserPayload extends UpdateUserInput {
  hashedPassword?: string;
}

export interface UserRepositoryPort {
  findAll(filter?: UserFilter): Promise<UserPublic[]>;
  findById(id: string): Promise<UserPublic | null>;
  findByEmail(email: string): Promise<{ id: string } | null>;
  findRoleById(roleId: string): Promise<{ id: string } | null>;
  validateOrganizationIds(
    companyId: string,
    areaId: string,
    branchId: string,
  ): Promise<void>;
  update(id: string, payload: UpdateUserPayload): Promise<UserPublic>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
