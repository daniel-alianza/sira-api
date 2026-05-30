import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { RoleRepositoryPort } from '../application/interfaces/role.port';

@Injectable()
export class PrismaRoleRepository implements RoleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findNameById(roleId: string): Promise<string | null> {
    return this.prisma.role
      .findUnique({
        where: { id: roleId },
        select: { name: true },
      })
      .then((role) => role?.name ?? null);
  }
}
