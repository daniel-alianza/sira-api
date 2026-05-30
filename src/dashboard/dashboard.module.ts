import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DASHBOARD_REPOSITORY } from './application/interfaces/dashboard.port';
import { GetDashboardOverviewUseCase } from './application/use-cases/get-dashboard-overview.use-case';
import { PrismaDashboardRepository } from './infrastructure/prisma-dashboard.repository';
import { DashboardController } from './presentation/dashboard.controller';

@Module({
  imports: [AuthModule],
  controllers: [DashboardController],
  providers: [
    GetDashboardOverviewUseCase,
    {
      provide: DASHBOARD_REPOSITORY,
      useClass: PrismaDashboardRepository,
    },
  ],
  exports: [DASHBOARD_REPOSITORY, GetDashboardOverviewUseCase],
})
export class DashboardModule {}
