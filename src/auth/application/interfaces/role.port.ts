export interface RoleRepositoryPort {
  findNameById(roleId: string): Promise<string | null>;
}

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
