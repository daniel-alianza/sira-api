import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuthUserRepositoryPort } from '../application/interfaces/auth-user.port';
import type {
  AuthUserRecord,
  SessionUser,
} from '../application/interfaces/login.interface';

@Injectable()
export class PrismaAuthUserRepository implements AuthUserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmailForLogin(email: string): Promise<AuthUserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        roleId: true,
        companyId: true,
        areaId: true,
        branchId: true,
        isActive: true,
        area: {
          select: {
            id: true,
            name: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user?.role || !user.area) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      roleId: user.roleId,
      companyId: user.companyId,
      areaId: user.areaId,
      branchId: user.branchId,
      isActive: user.isActive,
      role: user.role,
      area: user.area,
    };
  }

  async findSessionById(id: string): Promise<SessionUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        companyId: true,
        areaId: true,
        area: {
          select: {
            id: true,
            name: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user?.role || !user.area) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      companyId: user.companyId,
      areaId: user.areaId,
      area: user.area,
      role: user.role,
    };
  }
}
