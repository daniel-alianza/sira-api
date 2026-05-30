import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtPayload } from '../../application/interfaces/jwt.auth.port';
import {
  ROLE_REPOSITORY,
  type RoleRepositoryPort,
} from '../../application/interfaces/role.port';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const roleName = await this.roleRepository.findNameById(
      request.user.roleId,
    );

    if (!roleName || !requiredRoles.includes(roleName)) {
      throw new ForbiddenException('No tienes permisos para esta operación');
    }

    return true;
  }
}
