import { z } from 'zod';
import type { HybridIaNarrative } from '../interfaces/hybrid-ia-narrative.interface';

export const hybridIaNarrativeSchema = z.object({
  paragraph: z.string().min(1),
  riskNote: z.string().min(1),
});

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

export function parseHybridIaNarrative(raw: string): HybridIaNarrative {
  const jsonText = extractJsonObject(raw.trim());
  const parsedJson: unknown = JSON.parse(jsonText);
  return hybridIaNarrativeSchema.parse(parsedJson);
}
