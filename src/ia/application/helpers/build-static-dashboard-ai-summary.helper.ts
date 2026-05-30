import type { DashboardIaContext } from '../../../dashboard/application/interfaces/dashboard.interface';
import type { DashboardAiHighlight } from '../interfaces/dashboard-metrics.interface';
import { buildViewerAddress } from './build-viewer-address.helper';

export interface StaticDashboardAiSummaryPart {
  readonly headline: string;
  readonly highlights: readonly DashboardAiHighlight[];
  readonly trendNote: string;
}

interface BuildStaticDashboardAiSummaryInput {
  readonly context: DashboardIaContext;
  readonly viewerFullName: string;
}

function resolveScopeReference(context: DashboardIaContext): string {
  switch (context.analysisScope) {
    case 'organization':
      return 'la organización';
    case 'company':
      return 'la empresa seleccionada';
    case 'area':
      return context.areaComplianceTop[0]?.name ?? 'el área seleccionada';
    case 'responsible':
      return 'el responsable seleccionado';
  }
}

function buildHeadline(
  context: DashboardIaContext,
  greeting: string,
  scopeReference: string,
): string {
  const { kpis } = context;

  if (kpis.totalActions === 0) {
    return `${greeting}, sin actividad registrada en ${scopeReference} esta semana`;
  }

  if (kpis.expiredActions > 0) {
    return `${greeting}, ${kpis.expiredActions} acciones vencidas en ${scopeReference}`;
  }

  return `${greeting}, ${kpis.totalActions} acciones registradas en ${scopeReference} esta semana`;
}

function buildHighlights(context: DashboardIaContext): DashboardAiHighlight[] {
  const { kpis } = context;
  const highlights: DashboardAiHighlight[] = [
    {
      label: 'Acciones totales',
      value: String(kpis.totalActions),
      tone: 'neutral',
    },
    {
      label: 'Abiertas',
      value: String(kpis.openActions),
      tone: kpis.openActions > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Vencidas',
      value: String(kpis.expiredActions),
      tone: kpis.expiredActions > 0 ? 'warning' : 'success',
    },
    {
      label: 'Cerradas',
      value: String(kpis.closedActions),
      tone: kpis.closedActions > 0 ? 'success' : 'neutral',
    },
  ];

  if (kpis.pendingAcceptance > 0) {
    highlights.push({
      label: 'Pend. aceptación',
      value: String(kpis.pendingAcceptance),
      tone: 'warning',
    });
  }

  return highlights.slice(0, 4);
}

function buildTrendNote(context: DashboardIaContext): string {
  const trend = context.charts.weeklyTrend;

  if (trend.length === 0) {
    return 'Sin datos de tendencia diaria para la semana.';
  }

  const totals = trend.reduce(
    (accumulator, point) => ({
      created: accumulator.created + point.created,
      closed: accumulator.closed + point.closed,
      expired: accumulator.expired + point.expired,
    }),
    { created: 0, closed: 0, expired: 0 },
  );

  if (totals.created === 0 && totals.closed === 0 && totals.expired === 0) {
    return `Sin movimiento diario en ${context.period.label}.`;
  }

  const busiestDay = [...trend].sort((left, right) => {
    const leftTotal = left.created + left.closed + left.expired;
    const rightTotal = right.created + right.closed + right.expired;
    return rightTotal - leftTotal;
  })[0];

  return `Mayor actividad el ${busiestDay.day}: ${busiestDay.created} creadas, ${busiestDay.closed} cerradas y ${busiestDay.expired} vencidas.`;
}

export function buildStaticDashboardAiSummary(
  input: BuildStaticDashboardAiSummaryInput,
): StaticDashboardAiSummaryPart {
  const { greeting } = buildViewerAddress({ fullName: input.viewerFullName });
  const scopeReference = resolveScopeReference(input.context);

  return {
    headline: buildHeadline(input.context, greeting, scopeReference),
    highlights: buildHighlights(input.context),
    trendNote: buildTrendNote(input.context),
  };
}
