import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { buildApiResponse } from '../../common/helpers/build-api-response';
import { GetCatalogSelectorsUseCase } from '../application/use-cases/get-catalog-selectors.use-case';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly getCatalogSelectorsUseCase: GetCatalogSelectorsUseCase,
  ) {}

  @Get('selectors')
  @HttpCode(HttpStatus.OK)
  async getCatalogSelectors() {
    const selectors = await this.getCatalogSelectorsUseCase.execute();

    return buildApiResponse(
      selectors,
      'Selectores de catálogo obtenidos correctamente',
    );
  }
}
