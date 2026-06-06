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
import { GetCurrentUserUseCase } from '../../auth/application/use-cases/get-current-user.use-case';
import type { JwtPayload } from '../../auth/application/interfaces/jwt.auth.port';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { GenerateDashboardAiSummaryUseCase } from '../application/use-cases/generate-dashboard-ai-summary.use-case';
import { dashboardSummaryQuerySchema } from './dtos/dashboard-summary-query.dto';

@Controller('ia')
@UseGuards(JwtAuthGuard)
export class IaController {
  constructor(
    private readonly generateDashboardAiSummaryUseCase: GenerateDashboardAiSummaryUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
  ) {}

  @Get('dashboard-summary')
  @HttpCode(HttpStatus.OK)
  async getDashboardSummary(
    @Query() query: Record<string, unknown>,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const parsedQuery = dashboardSummaryQuerySchema.safeParse(query);

    if (!parsedQuery.success) {
      const firstIssue = parsedQuery.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'query';
      throw new BadRequestException(`${field}: ${firstIssue?.message}`);
    }

    const sessionUser = await this.getCurrentUserUseCase.execute(currentUser.sub);

    const summary = await this.generateDashboardAiSummaryUseCase.execute({
      filter: {
        companyId: parsedQuery.data.companyId,
        areaId: parsedQuery.data.areaId,
        responsibleId: parsedQuery.data.responsibleId,
        status: parsedQuery.data.status,
        detectionType: parsedQuery.data.detectionType,
        dateFrom: parsedQuery.data.dateFrom,
        dateTo: parsedQuery.data.dateTo,
      },
      viewer: {
        fullName: sessionUser.name,
        roleName: sessionUser.role.name,
        companyId: sessionUser.companyId,
        areaId: sessionUser.areaId,
      },
      userId: currentUser.sub,
      refresh: parsedQuery.data.refresh,
    });

    const message = summary.fromCache
      ? 'Resumen de IA obtenido desde caché'
      : 'Resumen de IA generado correctamente';

    return buildApiResponse(summary, message);
  }
}
