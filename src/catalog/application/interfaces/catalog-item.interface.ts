export interface CatalogItem {
  id: string;
  name: string;
}

export interface CatalogSelectors {
  companies: CatalogItem[];
  branches: CatalogItem[];
  areas: CatalogItem[];
  roles: CatalogItem[];
}
