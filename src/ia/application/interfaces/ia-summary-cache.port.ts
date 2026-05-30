import type { DashboardAiSummary } from './dashboard-metrics.interface';

export const IA_SUMMARY_CACHE_PORT = Symbol('IA_SUMMARY_CACHE_PORT');

export interface IaSummaryCachePort {
  get(cacheKey: string): Promise<DashboardAiSummary | null>;
  set(
    cacheKey: string,
    summary: DashboardAiSummary,
    ttlSeconds: number,
  ): Promise<void>;
}
