import { Module } from '@nestjs/common';
import { CATALOG_REPOSITORY } from './application/interfaces/catalog.port';
import { GetCatalogSelectorsUseCase } from './application/use-cases/get-catalog-selectors.use-case';
import { PrismaCatalogRepository } from './infrastructure/prisma-catalog.repository';
import { CatalogController } from './presentation/catalog.controller';

@Module({
  controllers: [CatalogController],
  providers: [
    GetCatalogSelectorsUseCase,
    {
      provide: CATALOG_REPOSITORY,
      useClass: PrismaCatalogRepository,
    },
  ],
})
export class CatalogModule {}
