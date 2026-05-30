import type {
  DashboardIaAnalysisScope,
  DashboardIaContext,
  DashboardOverview,
  DashboardQueryFilter,
} from './dashboard.interface';

export const DASHBOARD_REPOSITORY = Symbol('DASHBOARD_REPOSITORY');

export interface DashboardIaContextQuery {
  readonly filter: DashboardQueryFilter;
  readonly analysisScope: DashboardIaAnalysisScope;
  readonly analysisScopeLabel: string;
}

export interface DashboardRepositoryPort {
  getOverview(filter: DashboardQueryFilter): Promise<DashboardOverview>;
  getIaContext(query: DashboardIaContextQuery): Promise<DashboardIaContext>;
}
