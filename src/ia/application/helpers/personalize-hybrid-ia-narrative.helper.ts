import type { HybridIaNarrative } from '../interfaces/hybrid-ia-narrative.interface';

function stripViewerGreeting(paragraph: string): string {
  const trimmed = paragraph.trim();
  const withoutGreeting = trimmed.replace(/^(Señor(?:ita)?\s+[^,]+,\s*)/i, '');

  if (withoutGreeting === trimmed) {
    return trimmed;
  }

  if (withoutGreeting.length === 0) {
    return trimmed;
  }

  return `${withoutGreeting.charAt(0).toUpperCase()}${withoutGreeting.slice(1)}`;
}

export function sanitizeHybridIaNarrative(
  narrative: HybridIaNarrative,
): HybridIaNarrative {
  return {
    paragraph: stripViewerGreeting(narrative.paragraph),
    riskNote: narrative.riskNote.trim(),
  };
}
