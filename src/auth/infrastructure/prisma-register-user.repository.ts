import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type {
  CreateUserPayload,
  RegisterUserRepositoryPort,
} from '../application/interfaces/register-user.port';
import type { RegisterInterface } from '../application/interfaces/register.interface';

@Injectable()
export class PrismaRegisterUserRepository implements RegisterUserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<{ id: string } | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  findRoleByName(name: string): Promise<{ id: string } | null> {
    return this.prisma.role.findUnique({
      where: { name },
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

  async create(payload: CreateUserPayload): Promise<RegisterInterface> {
    const user = await this.prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: payload.hashedPassword,
        companyId: payload.companyId,
        areaId: payload.areaId,
        branchId: payload.branchId,
        roleId: payload.roleId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyId: true,
        areaId: true,
        branchId: true,
        roleId: true,
        isActive: true,
      },
    });

    return user;
  }
}
