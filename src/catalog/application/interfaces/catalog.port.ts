import type { CatalogSelectors } from './catalog-item.interface';

export interface CatalogRepositoryPort {
  findCatalogSelectors(): Promise<CatalogSelectors>;
}

export const CATALOG_REPOSITORY = Symbol('CATALOG_REPOSITORY');
