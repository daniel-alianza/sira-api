import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { CatalogSelectors } from '../application/interfaces/catalog-item.interface';
import type { CatalogRepositoryPort } from '../application/interfaces/catalog.port';

@Injectable()
export class PrismaCatalogRepository implements CatalogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findCatalogSelectors(): Promise<CatalogSelectors> {
    const [companies, branches, areas, roles] = await Promise.all([
      this.prisma.company.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.branch.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.area.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.role.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return { companies, branches, areas, roles };
  }
}
