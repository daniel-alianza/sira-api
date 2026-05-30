import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { buildApiResponse } from '../../common/helpers/build-api-response';
import {
  ROLE_ADMINISTRATOR,
  ROLE_INSPECTOR,
} from '../../auth/application/constants/role-names';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { ExportReportsWorkbookUseCase } from '../application/use-cases/export-reports-workbook.use-case';
import { GetReportsPreviewUseCase } from '../application/use-cases/get-reports-preview.use-case';
import type { ReportsQueryFilter } from '../application/interfaces/reports.interface';
import { reportsQuerySchema } from './dtos/reports-query.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE_ADMINISTRATOR, ROLE_INSPECTOR)
export class ReportsController {
  constructor(
    private readonly getReportsPreviewUseCase: GetReportsPreviewUseCase,
    private readonly exportReportsWorkbookUseCase: ExportReportsWorkbookUseCase,
  ) {}

  @Get('preview')
  @HttpCode(HttpStatus.OK)
  async getPreview(@Query() query: Record<string, unknown>) {
    const filter = this.parseQuery(query);
    const preview = await this.getReportsPreviewUseCase.execute(filter);

    return buildApiResponse(
      preview,
      'Vista previa de reportes obtenida correctamente',
    );
  }

  @Get('export')
  async exportWorkbook(
    @Query() query: Record<string, unknown>,
    @Res() response: Response,
  ) {
    const filter = this.parseQuery(query);
    const { buffer, fileName } =
      await this.exportReportsWorkbookUseCase.execute(filter);

    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );
    response.send(buffer);
  }

  private parseQuery(query: Record<string, unknown>): ReportsQueryFilter {
    const parsedQuery = reportsQuerySchema.safeParse(query);

    if (!parsedQuery.success) {
      const firstIssue = parsedQuery.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'query';
      throw new BadRequestException(`${field}: ${firstIssue?.message}`);
    }

    return {
      periodPreset: parsedQuery.data.periodPreset,
      dateFrom: parsedQuery.data.dateFrom,
      dateTo: parsedQuery.data.dateTo,
      companyId: parsedQuery.data.companyId,
      areaId: parsedQuery.data.areaId,
      responsibleId: parsedQuery.data.responsibleId,
      status: parsedQuery.data.status,
      detectionType: parsedQuery.data.detectionType,
    };
  }
}
