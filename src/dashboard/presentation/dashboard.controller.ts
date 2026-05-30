import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { buildApiResponse } from '../../common/helpers/build-api-response';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { GetDashboardOverviewUseCase } from '../application/use-cases/get-dashboard-overview.use-case';
import { dashboardOverviewQuerySchema } from './dtos/dashboard-overview-query.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly getDashboardOverviewUseCase: GetDashboardOverviewUseCase,
  ) {}

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  async getOverview(@Query() query: Record<string, unknown>) {
    const parsedQuery = dashboardOverviewQuerySchema.safeParse(query);

    if (!parsedQuery.success) {
      const firstIssue = parsedQuery.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'query';
      throw new BadRequestException(`${field}: ${firstIssue?.message}`);
    }

    const overview = await this.getDashboardOverviewUseCase.execute({
      companyId: parsedQuery.data.companyId,
      areaId: parsedQuery.data.areaId,
      responsibleId: parsedQuery.data.responsibleId,
      status: parsedQuery.data.status,
      detectionType: parsedQuery.data.detectionType,
      dateFrom: parsedQuery.data.dateFrom,
      dateTo: parsedQuery.data.dateTo,
    });

    return buildApiResponse(
      overview,
      'Dashboard obtenido correctamente',
    );
  }
}
