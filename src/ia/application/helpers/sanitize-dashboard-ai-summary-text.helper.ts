import type { DashboardAiSummary } from '../interfaces/dashboard-metrics.interface';
import { stripFormalAddressFromText } from './strip-formal-address-from-text.helper';

export function sanitizeDashboardAiSummaryText(
  summary: DashboardAiSummary,
): DashboardAiSummary {
  return {
    ...summary,
    headline: stripFormalAddressFromText(summary.headline),
    paragraphs: summary.paragraphs.map(stripFormalAddressFromText),
    trendNote: stripFormalAddressFromText(summary.trendNote),
    riskNote: stripFormalAddressFromText(summary.riskNote),
  };
}
