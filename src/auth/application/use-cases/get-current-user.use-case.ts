import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { SessionUser } from '../interfaces/login.interface';
import {
  AUTH_USER_REPOSITORY,
  type AuthUserRepositoryPort,
} from '../interfaces/auth-user.port';

@Injectable()
export class GetCurrentUserUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly authUserRepository: AuthUserRepositoryPort,
  ) {}

  async execute(userId: string): Promise<SessionUser> {
    const user = await this.authUserRepository.findSessionById(userId);

    if (!user) {
      throw new UnauthorizedException('Sesión no válida');
    }

    return user;
  }
}
