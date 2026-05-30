import { Inject, Injectable } from '@nestjs/common';
import type { CatalogSelectors } from '../interfaces/catalog-item.interface';
import {
  CATALOG_REPOSITORY,
  type CatalogRepositoryPort,
} from '../interfaces/catalog.port';

@Injectable()
export class GetCatalogSelectorsUseCase {
  constructor(
    @Inject(CATALOG_REPOSITORY)
    private readonly catalogRepository: CatalogRepositoryPort,
  ) {}

  execute(): Promise<CatalogSelectors> {
    return this.catalogRepository.findCatalogSelectors();
  }
}
