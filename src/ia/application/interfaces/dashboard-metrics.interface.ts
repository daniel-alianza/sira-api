export type DashboardAiHighlightTone = 'success' | 'warning' | 'neutral';

export interface DashboardIaViewer {
  readonly fullName: string;
  readonly roleName: string;
  readonly companyId: string;
  readonly areaId: string;
}

export interface DashboardAiHighlight {
  readonly label: string;
  readonly value: string;
  readonly tone: DashboardAiHighlightTone;
}

export interface DashboardAiSummary {
  readonly generatedAt: string;
  readonly headline: string;
  readonly paragraphs: readonly string[];
  readonly highlights: readonly DashboardAiHighlight[];
  readonly trendNote: string;
  readonly riskNote: string;
  readonly fromCache: boolean;
}
