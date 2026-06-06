import {
  ROLE_ADMINISTRATOR,
  ROLE_INSPECTOR,
  ROLE_RESPONSIBLE,
} from '../../../auth/application/constants/role-names';
import type {
  DashboardIaAnalysisScope,
  DashboardQueryFilter,
} from '../../../dashboard/application/interfaces/dashboard.interface';

interface ResolveDashboardIaQueryFilterInput {
  readonly filter: DashboardQueryFilter;
  readonly viewerRoleName: string;
  readonly viewerAreaId?: string;
  readonly viewerCompanyId?: string;
}

export interface ResolvedDashboardIaQuery {
  readonly filter: DashboardQueryFilter;
  readonly analysisScope: DashboardIaAnalysisScope;
  readonly analysisScopeLabel: string;
}

function resolveAnalysisScope(
  filter: DashboardQueryFilter,
): DashboardIaAnalysisScope {
  if (filter.responsibleId) {
    return 'responsible';
  }

  if (filter.areaId) {
    return 'area';
  }

  if (filter.companyId) {
    return 'company';
  }

  return 'organization';
}

function resolveAnalysisScopeLabel(
  scope: DashboardIaAnalysisScope,
): string {
  switch (scope) {
    case 'organization':
      return 'Toda la organización (todas las empresas y áreas, sin filtro de área ni responsable)';
    case 'company':
      return 'Empresa seleccionada en filtros';
    case 'area':
      return 'Área seleccionada en filtros';
    case 'responsible':
      return 'Responsable seleccionado en filtros';
  }
}

function mergeDashboardIaFilter(
  scopedFilter: Pick<
    DashboardQueryFilter,
    'companyId' | 'areaId' | 'responsibleId'
  >,
  source: DashboardQueryFilter,
): DashboardQueryFilter {
  return {
    ...scopedFilter,
    dateFrom: source.dateFrom,
    dateTo: source.dateTo,
    status: source.status,
    detectionType: source.detectionType,
  };
}

export function resolveDashboardIaQueryFilter(
  input: ResolveDashboardIaQueryFilterInput,
): ResolvedDashboardIaQuery {
  if (
    input.viewerRoleName === ROLE_ADMINISTRATOR ||
    input.viewerRoleName === ROLE_INSPECTOR
  ) {
    const filter = mergeDashboardIaFilter(
      {
        companyId: input.filter.companyId,
        areaId: input.filter.areaId,
        responsibleId: input.filter.responsibleId,
      },
      input.filter,
    );
    const analysisScope = resolveAnalysisScope(filter);

    return {
      filter,
      analysisScope,
      analysisScopeLabel: resolveAnalysisScopeLabel(analysisScope),
    };
  }

  if (input.viewerRoleName === ROLE_RESPONSIBLE) {
    const filter = mergeDashboardIaFilter(
      {
        companyId: input.filter.companyId ?? input.viewerCompanyId,
        areaId: input.filter.areaId ?? input.viewerAreaId,
        responsibleId: input.filter.responsibleId,
      },
      input.filter,
    );
    const analysisScope = resolveAnalysisScope(filter);

    return {
      filter,
      analysisScope,
      analysisScopeLabel: resolveAnalysisScopeLabel(analysisScope),
    };
  }

  const analysisScope = resolveAnalysisScope(input.filter);

  return {
    filter: input.filter,
    analysisScope,
    analysisScopeLabel: resolveAnalysisScopeLabel(analysisScope),
  };
}
