import type { DashboardQueryFilter } from '../../../dashboard/application/interfaces/dashboard.interface';

interface BuildIaSummaryBatchCacheKeyInput {
  readonly periodFrom: string;
  readonly periodTo: string;
  readonly filter: DashboardQueryFilter;
}

export function buildIaSummaryBatchCacheKey(
  input: BuildIaSummaryBatchCacheKeyInput,
): string {
  return [
    'batch',
    input.periodFrom,
    input.periodTo,
    input.filter.companyId ?? '_',
    input.filter.areaId ?? '_',
    input.filter.responsibleId ?? '_',
  ].join(':');
}
