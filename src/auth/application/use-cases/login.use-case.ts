import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { JwtPayload } from '../interfaces/jwt.auth.port';
import { JWT_AUTH, type JwtAuthPort } from '../interfaces/jwt.auth.port';
import type {
  LoginCredentials,
  LoginResult,
} from '../interfaces/login.interface';
import {
  AUTH_USER_REPOSITORY,
  type AuthUserRepositoryPort,
} from '../interfaces/auth-user.port';
import { PasswordVerifyUseCase } from './password-verify.use-case';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly authUserRepository: AuthUserRepositoryPort,
    private readonly passwordVerifyUseCase: PasswordVerifyUseCase,
    @Inject(JWT_AUTH)
    private readonly jwtAuth: JwtAuthPort,
  ) {}

  async execute(credentials: LoginCredentials): Promise<LoginResult> {
    const user = await this.authUserRepository.findByEmailForLogin(
      credentials.email,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Usuario inactivo');
    }

    const isPasswordValid = await this.passwordVerifyUseCase.execute(
      credentials.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    const accessToken = await this.jwtAuth.sign(jwtPayload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        companyId: user.companyId,
        areaId: user.areaId,
        role: user.role,
      },
    };
  }
}
