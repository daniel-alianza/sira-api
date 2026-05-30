import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  REPORTS_REPOSITORY,
  type ReportsRepositoryPort,
} from '../interfaces/reports.port';
import type { ReportsPreview, ReportsQueryFilter } from '../interfaces/reports.interface';

@Injectable()
export class GetReportsPreviewUseCase {
  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly reportsRepository: ReportsRepositoryPort,
  ) {}

  async execute(filter: ReportsQueryFilter): Promise<ReportsPreview> {
    try {
      return await this.reportsRepository.getPreview(filter);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'REPORTS_CUSTOM_DATES_REQUIRED') {
          throw new BadRequestException(
            'Selecciona fecha inicio y fin para el periodo personalizado',
          );
        }
        if (error.message === 'REPORTS_INVALID_DATE_RANGE') {
          throw new BadRequestException(
            'La fecha fin debe ser igual o posterior a la fecha inicio',
          );
        }
      }

      throw error;
    }
  }
}
