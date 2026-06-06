import type { HybridIaNarrative } from '../interfaces/hybrid-ia-narrative.interface';
import { stripFormalAddressFromText } from './strip-formal-address-from-text.helper';

export function sanitizeHybridIaNarrative(
  narrative: HybridIaNarrative,
): HybridIaNarrative {
  return {
    paragraph: stripFormalAddressFromText(narrative.paragraph),
    riskNote: stripFormalAddressFromText(narrative.riskNote),
  };
}
