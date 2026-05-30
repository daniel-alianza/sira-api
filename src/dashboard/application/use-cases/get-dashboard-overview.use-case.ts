import { Inject, Injectable } from '@nestjs/common';
import type {
  DashboardOverview,
  DashboardQueryFilter,
} from '../interfaces/dashboard.interface';
import {
  DASHBOARD_REPOSITORY,
  type DashboardRepositoryPort,
} from '../interfaces/dashboard.port';

@Injectable()
export class GetDashboardOverviewUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: DashboardRepositoryPort,
  ) {}

  execute(filter: DashboardQueryFilter): Promise<DashboardOverview> {
    return this.dashboardRepository.getOverview(filter);
  }
}
