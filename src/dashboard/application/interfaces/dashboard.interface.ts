export type DashboardHighlightTone = 'success' | 'warning' | 'neutral';

export interface DashboardFilterOption {
  readonly value: string;
  readonly label: string;
}

export interface DashboardQueryFilter {
  readonly companyId?: string;
  readonly areaId?: string;
  readonly responsibleId?: string;
  readonly status?: string;
  readonly detectionType?: 'unsafe_act' | 'unsafe_condition';
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

export interface DashboardKpis {
  readonly totalActions: number;
  readonly openActions: number;
  readonly closedActions: number;
  readonly pendingAcceptance: number;
  readonly expiredActions: number;
  readonly closureReview: number;
  readonly rejectedClosures: number;
  readonly walkthroughsPeriod: number;
  readonly avgClosureDays: number;
  readonly notRespondedUsers: number;
  readonly notSignedUsers: number;
}

export interface DashboardAreaComplianceItem {
  readonly id: string;
  readonly name: string;
  readonly compliance: number;
  readonly nonCompliance: number;
  readonly actionsTotal: number;
  readonly expired: number;
  readonly trend: string;
}

export interface DashboardCommitmentDateRequestItem {
  readonly id: string;
  readonly actionId: string;
  readonly actionFolio: string;
  readonly walkthroughFolio: string;
  readonly responsible: string;
  readonly area: string;
  readonly companyName: string;
  readonly branchName: string;
  readonly description: string;
  readonly initialDate: string;
  readonly currentDate: string;
  readonly requestedDate: string;
  readonly changeLabel: string;
  readonly reason: string;
  readonly evidencePhotoUrl: string | null;
  readonly resolutionPhotoUrl: string | null;
  readonly status: 'pending' | 'review';
}

export interface DashboardQueuePendingSignatureItem {
  readonly id: string;
  readonly actionFolio: string;
  readonly responsible: string;
  readonly area: string;
  readonly assignedAt: string;
  readonly commitmentDate: string;
}

export interface DashboardQueueClosureReviewItem {
  readonly id: string;
  readonly actionFolio: string;
  readonly responsible: string;
  readonly area: string;
  readonly requestedAt: string;
  readonly legend: 'Pendiente' | 'Expirado';
}

export interface DashboardQueueExpiredActionItem {
  readonly id: string;
  readonly actionFolio: string;
  readonly responsible: string;
  readonly area: string;
  readonly commitmentDate: string;
  readonly daysOverdue: number;
}

export interface DashboardActionsTrendPoint {
  readonly month: string;
  readonly created: number;
  readonly closed: number;
  readonly expired: number;
}

export interface DashboardWeeklyTrendPoint {
  readonly day: string;
  readonly created: number;
  readonly closed: number;
  readonly expired: number;
}

export interface DashboardComplianceByAreaChartItem {
  readonly label: string;
  readonly compliance: number;
  readonly nonCompliance: number;
  readonly actionsTotal: number;
  readonly closedActions: number;
}

export interface DashboardStatusDistributionItem {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

export interface DashboardUpcomingDueItem {
  readonly days: string;
  readonly count: number;
}

export interface DashboardOperationalQueues {
  readonly pendingSignature: readonly DashboardQueuePendingSignatureItem[];
  readonly closureReview: readonly DashboardQueueClosureReviewItem[];
  readonly expiredActions: readonly DashboardQueueExpiredActionItem[];
}

export interface DashboardCharts {
  readonly actionsTrend: readonly DashboardActionsTrendPoint[];
  readonly complianceByArea: readonly DashboardComplianceByAreaChartItem[];
  readonly statusDistribution: readonly DashboardStatusDistributionItem[];
  readonly upcomingDue: readonly DashboardUpcomingDueItem[];
}

export type DashboardOpenActionStatus =
  | 'pending_acceptance'
  | 'open'
  | 'pending'
  | 'expired'
  | 'closure_review'
  | 'closed'
  | 'rejected'
  | 'reopened';

export interface DashboardOpenActionItem {
  readonly id: string;
  readonly detectionFolio: string;
  readonly walkthroughFolio: string;
  readonly description: string;
  readonly status: DashboardOpenActionStatus;
  readonly areaName: string;
  readonly responsibleName: string;
  readonly evidencePhotoUrl: string | null;
}

export interface DashboardOverview {
  readonly period: {
    readonly from: string;
    readonly to: string;
  };
  readonly firstWalkthroughDate: string | null;
  readonly filterOptions: {
    readonly companies: readonly DashboardFilterOption[];
    readonly areas: readonly DashboardFilterOption[];
    readonly responsibles: readonly DashboardFilterOption[];
  };
  readonly kpis: DashboardKpis;
  readonly openActions: readonly DashboardOpenActionItem[];
  readonly areaCompliance: readonly DashboardAreaComplianceItem[];
  readonly commitmentDateRequests: readonly DashboardCommitmentDateRequestItem[];
  readonly operationalQueues: DashboardOperationalQueues;
  readonly charts: DashboardCharts;
}

export type DashboardIaAnalysisScope =
  | 'organization'
  | 'company'
  | 'area'
  | 'responsible';

export interface DashboardIaAreaComplianceSlim {
  readonly name: string;
  readonly compliance: number;
  readonly expired: number;
  readonly actionsTotal: number;
}

export interface DashboardIaQueuePendingSignatureSlim {
  readonly folio: string;
  readonly area: string;
}

export interface DashboardIaQueueClosureReviewSlim {
  readonly folio: string;
  readonly area: string;
  readonly legend: 'Pendiente' | 'Expirado';
}

export interface DashboardIaQueueExpiredSlim {
  readonly folio: string;
  readonly area: string;
  readonly daysOverdue: number;
}

export interface DashboardIaOperationalQueuesSlim {
  readonly pendingSignatureCount: number;
  readonly closureReviewCount: number;
  readonly expiredCount: number;
  readonly pendingSignatureTop: readonly DashboardIaQueuePendingSignatureSlim[];
  readonly closureReviewTop: readonly DashboardIaQueueClosureReviewSlim[];
  readonly expiredTop: readonly DashboardIaQueueExpiredSlim[];
}

export interface DashboardIaStatusDistributionSlim {
  readonly label: string;
  readonly value: number;
}

export interface DashboardIaContext {
  readonly periodScope: 'filtered_period';
  readonly analysisScope: DashboardIaAnalysisScope;
  readonly analysisScopeLabel: string;
  readonly period: DashboardOverview['period'] & {
    readonly label: string;
  };
  readonly timeMetricsBasis: string;
  readonly filters: {
    readonly companyId: string | null;
    readonly areaId: string | null;
    readonly responsibleId: string | null;
  };
  readonly kpis: DashboardKpis;
  readonly areaComplianceTop: readonly DashboardIaAreaComplianceSlim[];
  readonly commitmentDateRequestsCount: number;
  readonly operationalQueues: DashboardIaOperationalQueuesSlim;
  readonly charts: {
    readonly weeklyTrend: readonly DashboardWeeklyTrendPoint[];
    readonly statusDistribution: readonly DashboardIaStatusDistributionSlim[];
    readonly upcomingDue: readonly DashboardUpcomingDueItem[];
  };
  readonly topExpiredAreas: readonly string[];
}
