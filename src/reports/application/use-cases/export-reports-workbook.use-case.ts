import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { buildReportsWorkbookBuffer } from '../helpers/build-reports-workbook.helper';
import type { ReportsQueryFilter } from '../interfaces/reports.interface';
import {
  REPORTS_REPOSITORY,
  type ReportsRepositoryPort,
} from '../interfaces/reports.port';

@Injectable()
export class ExportReportsWorkbookUseCase {
  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly reportsRepository: ReportsRepositoryPort,
  ) {}

  async execute(filter: ReportsQueryFilter): Promise<{
    readonly buffer: Buffer;
    readonly fileName: string;
  }> {
    try {
      const dataset = await this.reportsRepository.getExportDataset(filter);
      const buffer = await buildReportsWorkbookBuffer(dataset);

      return {
        buffer,
        fileName: dataset.exportFileName,
      };
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
