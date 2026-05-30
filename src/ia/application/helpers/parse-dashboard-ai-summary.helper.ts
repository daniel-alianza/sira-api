import { z } from 'zod';

export const dashboardAiHighlightSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  tone: z.enum(['success', 'warning', 'neutral']),
});

export const dashboardAiSummaryPayloadSchema = z.object({
  headline: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(1).max(4),
  highlights: z.array(dashboardAiHighlightSchema).min(1).max(6),
  trendNote: z.string().min(1),
  riskNote: z.string().min(1),
});

export type DashboardAiSummaryPayload = z.infer<
  typeof dashboardAiSummaryPayloadSchema
>;

export function parseDashboardAiSummaryPayload(raw: string): DashboardAiSummaryPayload {
  const trimmed = raw.trim();
  const jsonText = extractJsonObject(trimmed);
  const parsedJson: unknown = JSON.parse(jsonText);
  return dashboardAiSummaryPayloadSchema.parse(parsedJson);
}

function extractJsonObject(raw: string): string {
  const fencedMatch = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }

  return raw;
}
