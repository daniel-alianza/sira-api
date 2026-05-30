export type ReportsPeriodPreset = 'daily' | 'weekly' | 'custom';

export interface ReportsFilterOption {
  readonly value: string;
  readonly label: string;
}

export interface ReportsQueryFilter {
  readonly periodPreset: ReportsPeriodPreset;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly companyId?: string;
  readonly areaId?: string;
  readonly responsibleId?: string;
  readonly status?: string;
  readonly detectionType?: 'unsafe_act' | 'unsafe_condition';
}

export interface ReportsKpis {
  readonly totalActions: number;
  readonly openActions: number;
  readonly closedActions: number;
  readonly pendingAcceptance: number;
  readonly expiredActions: number;
  readonly closureReview: number;
  readonly rejectedClosures: number;
  readonly walkthroughsPeriod: number;
  readonly avgClosureDays: number;
}

export interface ReportsSheetCounts {
  readonly actions: number;
  readonly commitments: number;
  readonly walkthroughs: number;
  readonly detections: number;
}

export interface ReportsPreview {
  readonly period: {
    readonly from: string;
    readonly to: string;
    readonly preset: ReportsPeriodPreset;
    readonly label: string;
  };
  readonly filterOptions: {
    readonly companies: readonly ReportsFilterOption[];
    readonly areas: readonly ReportsFilterOption[];
    readonly responsibles: readonly ReportsFilterOption[];
  };
  readonly kpis: ReportsKpis;
  readonly sheetCounts: ReportsSheetCounts;
  readonly exportFileName: string;
}

export interface ReportsExportActionRow {
  readonly walkthroughFolio: string;
  readonly detectionFolio: string;
  readonly companyName: string;
  readonly branchName: string;
  readonly areaName: string;
  readonly inspectorName: string;
  readonly responsibleName: string;
  readonly tourDate: string;
  readonly detectedAt: string;
  readonly initialCommitmentDate: string;
  readonly currentCommitmentDate: string;
  readonly statusLabel: string;
  readonly deadlineLegend: string;
  readonly description: string;
  readonly correctivePlan: string;
  readonly hasInitialEvidence: boolean;
  readonly hasSignedAcknowledgment: boolean;
  readonly hasDateReschedule: boolean;
  readonly hasResolutionPhoto: boolean;
  readonly isClosureApproved: boolean;
  readonly hasClosureRejection: boolean;
  readonly closureRejectionReason: string;
  readonly dateChangeReasons: string;
  readonly signedAt: string;
  readonly resolutionAt: string;
  readonly resolutionMinutes: string;
  readonly closedOnTime: string;
}

export interface ReportsExportCommitmentRow {
  readonly detectionFolio: string;
  readonly sequenceLabel: string;
  readonly commitmentDate: string;
  readonly signedAt: string;
  readonly signedByName: string;
  readonly changeReason: string;
  readonly hasResolutionPhoto: boolean;
  readonly isCurrent: boolean;
}

export interface ReportsExportWalkthroughRow {
  readonly folio: string;
  readonly tourDate: string;
  readonly inspectorName: string;
  readonly isCompleted: boolean;
  readonly detectionsCount: number;
  readonly actionsCount: number;
}

export interface ReportsExportDetectionRow {
  readonly walkthroughFolio: string;
  readonly detectionFolio: string;
  readonly companyName: string;
  readonly areaName: string;
  readonly detectionTypeLabel: string;
  readonly responsibleName: string;
  readonly description: string;
  readonly hasInitialEvidence: boolean;
  readonly hasCorrectiveAction: boolean;
}

export interface ReportsExportSummaryRow {
  readonly metric: string;
  readonly value: string;
}

export interface ReportsExportDataset {
  readonly periodLabel: string;
  readonly exportFileName: string;
  readonly actions: readonly ReportsExportActionRow[];
  readonly commitments: readonly ReportsExportCommitmentRow[];
  readonly walkthroughs: readonly ReportsExportWalkthroughRow[];
  readonly detections: readonly ReportsExportDetectionRow[];
  readonly summary: readonly ReportsExportSummaryRow[];
}
