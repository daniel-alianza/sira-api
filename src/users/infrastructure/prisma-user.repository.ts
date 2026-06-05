import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type {
  UpdateUserPayload,
  UserRepositoryPort,
} from '../application/interfaces/user.port';
import type { UserFilter, UserPublic } from '../application/interfaces/user.interface';

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  companyId: true,
  areaId: true,
  branchId: true,
  roleId: true,
} as const;

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filter?: UserFilter): Promise<UserPublic[]> {
    return this.prisma.user.findMany({
      where: {
        ...(filter?.companyId ? { companyId: filter.companyId } : {}),
        ...(filter?.areaId ? { areaId: filter.areaId } : {}),
        ...(filter?.branchId ? { branchId: filter.branchId } : {}),
      },
      select: userPublicSelect,
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string): Promise<UserPublic | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: userPublicSelect,
    });
  }

  findByEmail(email: string): Promise<{ id: string } | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  findRoleById(roleId: string): Promise<{ id: string } | null> {
    return this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    });
  }

  async validateOrganizationIds(
    companyId: string,
    areaId: string,
    branchId: string,
  ): Promise<void> {
    const [company, area, branch] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true },
      }),
      this.prisma.area.findUnique({
        where: { id: areaId },
        select: { id: true },
      }),
      this.prisma.branch.findUnique({
        where: { id: branchId },
        select: { id: true },
      }),
    ]);

    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    if (!area) {
      throw new NotFoundException('Área no encontrada');
    }

    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada');
    }
  }

  async update(id: string, payload: UpdateUserPayload): Promise<UserPublic> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.email !== undefined && { email: payload.email }),
        ...(payload.hashedPassword !== undefined && {
          password: payload.hashedPassword,
        }),
        ...(payload.companyId !== undefined && {
          companyId: payload.companyId,
        }),
        ...(payload.areaId !== undefined && { areaId: payload.areaId }),
        ...(payload.branchId !== undefined && {
          branchId: payload.branchId,
        }),
        ...(payload.roleId !== undefined && { roleId: payload.roleId }),
        ...(payload.isActive !== undefined && { isActive: payload.isActive }),
      },
      select: userPublicSelect,
    });

    return user;
  }
}
