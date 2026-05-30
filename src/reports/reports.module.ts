import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { REPORTS_REPOSITORY } from './application/interfaces/reports.port';
import { ExportReportsWorkbookUseCase } from './application/use-cases/export-reports-workbook.use-case';
import { GetReportsPreviewUseCase } from './application/use-cases/get-reports-preview.use-case';
import { PrismaReportsRepository } from './infrastructure/prisma-reports.repository';
import { ReportsController } from './presentation/reports.controller';

@Module({
  imports: [AuthModule],
  controllers: [ReportsController],
  providers: [
    GetReportsPreviewUseCase,
    ExportReportsWorkbookUseCase,
    {
      provide: REPORTS_REPOSITORY,
      useClass: PrismaReportsRepository,
    },
  ],
})
export class ReportsModule {}
