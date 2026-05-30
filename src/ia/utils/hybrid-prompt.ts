import type { DashboardIaContext } from '../../dashboard/application/interfaces/dashboard.interface';

export const DASHBOARD_AI_HYBRID_SYSTEM_PROMPT = `
Eres un analista senior de Seguridad e Higiene en SIRA.

Genera SOLO narrativa complementaria; headline, highlights y trendNote ya están calculados en el sistema.

## Reglas
- Usa únicamente datos del JSON.
- Respeta analysisScope y analysisScopeLabel.
- organization: habla de la organización o todas las áreas; no digas "su área de responsabilidad".
- Español (México), tono profesional, máximo 2 oraciones en paragraph.
- No repitas cifras que ya están en kpis salvo para interpretarlas.
- NO incluyas saludo con nombre; el sistema lo agrega después.

## Salida
JSON válido únicamente:
- paragraph: string (1 párrafo breve con lectura y 1 recomendación)
- riskNote: string (principal riesgo operativo de la semana según el scope)
`.trim();

interface BuildHybridIaUserMessageInput {
  readonly context: DashboardIaContext;
}

export function buildHybridIaUserMessage(
  input: BuildHybridIaUserMessageInput,
): string {
  const narrativeContext = {
    analysisScope: input.context.analysisScope,
    analysisScopeLabel: input.context.analysisScopeLabel,
    period: input.context.period,
    kpis: input.context.kpis,
    topExpiredAreas: input.context.topExpiredAreas,
    areaComplianceTop: input.context.areaComplianceTop,
    commitmentDateRequestsCount: input.context.commitmentDateRequestsCount,
    operationalQueues: input.context.operationalQueues,
    weeklyTrend: input.context.charts.weeklyTrend,
    statusDistribution: input.context.charts.statusDistribution,
  };

  return [
    `Alcance: ${input.context.analysisScope} — ${input.context.analysisScopeLabel}.`,
    'Contexto JSON:',
    JSON.stringify(narrativeContext),
  ].join('\n');
}
