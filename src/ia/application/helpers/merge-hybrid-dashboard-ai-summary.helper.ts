import type { DashboardAiSummary } from '../interfaces/dashboard-metrics.interface';
import type { HybridIaNarrative } from '../interfaces/hybrid-ia-narrative.interface';
import type { StaticDashboardAiSummaryPart } from './build-static-dashboard-ai-summary.helper';

interface MergeHybridDashboardAiSummaryInput {
  readonly generatedAt: string;
  readonly staticPart: StaticDashboardAiSummaryPart;
  readonly narrative: HybridIaNarrative;
  readonly fromCache: boolean;
}

export function mergeHybridDashboardAiSummary(
  input: MergeHybridDashboardAiSummaryInput,
): DashboardAiSummary {
  return {
    generatedAt: input.generatedAt,
    headline: input.staticPart.headline,
    paragraphs: [input.narrative.paragraph],
    highlights: input.staticPart.highlights,
    trendNote: input.staticPart.trendNote,
    riskNote: input.narrative.riskNote,
    fromCache: input.fromCache,
  };
}
