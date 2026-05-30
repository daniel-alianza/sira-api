import type { DashboardIaContext } from '../../../dashboard/application/interfaces/dashboard.interface';
import type { HybridIaNarrative } from '../interfaces/hybrid-ia-narrative.interface';

function resolveScopeReference(context: DashboardIaContext): string {
  switch (context.analysisScope) {
    case 'organization':
      return 'toda la organización';
    case 'company':
      return 'la empresa seleccionada';
    case 'area':
      return context.areaComplianceTop[0]?.name ?? 'el área seleccionada';
    case 'responsible':
      return 'el responsable seleccionado';
  }
}

export function shouldUseFallbackHybridNarrative(
  context: DashboardIaContext,
): boolean {
  const { kpis, operationalQueues } = context;

  return (
    kpis.totalActions === 0 &&
    kpis.expiredActions === 0 &&
    operationalQueues.pendingSignatureCount === 0 &&
    operationalQueues.closureReviewCount === 0 &&
    operationalQueues.expiredCount === 0 &&
    context.commitmentDateRequestsCount === 0
  );
}

export function buildFallbackHybridNarrative(
  context: DashboardIaContext,
): HybridIaNarrative {
  const scopeReference = resolveScopeReference(context);

  return {
    paragraph: `Durante ${context.period.label} no se registran acciones ni colas operativas pendientes en ${scopeReference}. Verifique que los recorridos y detecciones estén capturándose según el programa de la semana.`,
    riskNote: 'Sin riesgos operativos críticos identificados en la semana actual.',
  };
}
