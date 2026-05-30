import type { DashboardIaContext } from '../../../dashboard/application/interfaces/dashboard.interface';

export function buildDashboardMetricsFingerprint(
  context: DashboardIaContext,
): string {
  const snapshot = {
    analysisScope: context.analysisScope,
    periodFrom: context.period.from,
    periodTo: context.period.to,
    filters: context.filters,
    kpis: context.kpis,
    topExpiredAreas: context.topExpiredAreas,
    commitmentDateRequestsCount: context.commitmentDateRequestsCount,
    operationalQueues: {
      pendingSignatureCount: context.operationalQueues.pendingSignatureCount,
      closureReviewCount: context.operationalQueues.closureReviewCount,
      expiredCount: context.operationalQueues.expiredCount,
    },
    weeklyTrend: context.charts.weeklyTrend,
    statusDistribution: context.charts.statusDistribution,
  };

  return JSON.stringify(snapshot);
}
