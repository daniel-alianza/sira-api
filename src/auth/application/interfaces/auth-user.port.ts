import type { AuthUserRecord, SessionUser } from './login.interface';

export interface AuthUserRepositoryPort {
  findByEmailForLogin(email: string): Promise<AuthUserRecord | null>;
  findSessionById(id: string): Promise<SessionUser | null>;
}

export const AUTH_USER_REPOSITORY = Symbol('AUTH_USER_REPOSITORY');
