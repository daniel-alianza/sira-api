import type {
  DashboardAreaComplianceItem,
  DashboardIaContext,
  DashboardOperationalQueues,
  DashboardQueryFilter,
  DashboardStatusDistributionItem,
  DashboardWeeklyTrendPoint,
} from '../interfaces/dashboard.interface';

const IA_AREA_COMPLIANCE_TOP_LIMIT = 8;
const IA_QUEUE_TOP_LIMIT = 3;

interface BuildDashboardIaSlimContextInput {
  readonly analysisScope: DashboardIaContext['analysisScope'];
  readonly analysisScopeLabel: string;
  readonly period: DashboardIaContext['period'];
  readonly timeMetricsBasis: string;
  readonly filters: DashboardIaContext['filters'];
  readonly kpis: DashboardIaContext['kpis'];
  readonly areaCompliance: readonly DashboardAreaComplianceItem[];
  readonly commitmentDateRequestsCount: number;
  readonly operationalQueues: DashboardOperationalQueues;
  readonly weeklyTrend: readonly DashboardWeeklyTrendPoint[];
  readonly statusDistribution: readonly DashboardStatusDistributionItem[];
  readonly upcomingDue: DashboardIaContext['charts']['upcomingDue'];
  readonly topExpiredAreas: readonly string[];
}

function mapAreaComplianceTop(
  areas: readonly DashboardAreaComplianceItem[],
): DashboardIaContext['areaComplianceTop'] {
  return [...areas]
    .sort((left, right) => {
      if (right.expired !== left.expired) {
        return right.expired - left.expired;
      }

      return right.actionsTotal - left.actionsTotal;
    })
    .slice(0, IA_AREA_COMPLIANCE_TOP_LIMIT)
    .map((area) => ({
      name: area.name,
      compliance: area.compliance,
      expired: area.expired,
      actionsTotal: area.actionsTotal,
    }));
}

function mapOperationalQueuesSlim(
  queues: DashboardOperationalQueues,
): DashboardIaContext['operationalQueues'] {
  return {
    pendingSignatureCount: queues.pendingSignature.length,
    closureReviewCount: queues.closureReview.length,
    expiredCount: queues.expiredActions.length,
    pendingSignatureTop: queues.pendingSignature
      .slice(0, IA_QUEUE_TOP_LIMIT)
      .map((item) => ({
        folio: item.actionFolio,
        area: item.area,
      })),
    closureReviewTop: queues.closureReview
      .slice(0, IA_QUEUE_TOP_LIMIT)
      .map((item) => ({
        folio: item.actionFolio,
        area: item.area,
        legend: item.legend,
      })),
    expiredTop: queues.expiredActions
      .slice(0, IA_QUEUE_TOP_LIMIT)
      .map((item) => ({
        folio: item.actionFolio,
        area: item.area,
        daysOverdue: item.daysOverdue,
      })),
  };
}

function mapStatusDistributionSlim(
  items: readonly DashboardStatusDistributionItem[],
): DashboardIaContext['charts']['statusDistribution'] {
  return items.map((item) => ({
    label: item.label,
    value: item.value,
  }));
}

export function buildDashboardIaSlimContext(
  input: BuildDashboardIaSlimContextInput,
): DashboardIaContext {
  return {
    periodScope: 'filtered_period',
    analysisScope: input.analysisScope,
    analysisScopeLabel: input.analysisScopeLabel,
    period: input.period,
    timeMetricsBasis: input.timeMetricsBasis,
    filters: input.filters,
    kpis: input.kpis,
    areaComplianceTop: mapAreaComplianceTop(input.areaCompliance),
    commitmentDateRequestsCount: input.commitmentDateRequestsCount,
    operationalQueues: mapOperationalQueuesSlim(input.operationalQueues),
    charts: {
      weeklyTrend: input.weeklyTrend,
      statusDistribution: mapStatusDistributionSlim(input.statusDistribution),
      upcomingDue: input.upcomingDue,
    },
    topExpiredAreas: input.topExpiredAreas,
  };
}

export function buildDashboardIaSlimFilters(
  filter: DashboardQueryFilter,
): DashboardIaContext['filters'] {
  return {
    companyId: filter.companyId ?? null,
    areaId: filter.areaId ?? null,
    responsibleId: filter.responsibleId ?? null,
  };
}
