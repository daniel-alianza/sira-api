import type { DashboardQueryFilter } from '../../../dashboard/application/interfaces/dashboard.interface';

interface BuildIaSummaryCacheKeyInput {
  readonly userId: string;
  readonly periodFrom: string;
  readonly periodTo: string;
  readonly filter: DashboardQueryFilter;
  readonly metricsFingerprint: string;
}

export function buildIaSummaryCacheKey(
  input: BuildIaSummaryCacheKeyInput,
): string {
  return [
    input.userId,
    input.periodFrom,
    input.periodTo,
    input.filter.companyId ?? '_',
    input.filter.areaId ?? '_',
    input.filter.responsibleId ?? '_',
    input.filter.status ?? '_',
    input.filter.detectionType ?? '_',
    input.metricsFingerprint,
  ].join(':');
}
