import type { CommitmentHistoryItem } from './commitment-history.interface';

export type CorrectiveDetectionType = 'unsafe_act' | 'unsafe_condition';

export type CorrectiveActionStatus =
  | 'pending_acceptance'
  | 'open'
  | 'pending'
  | 'expired'
  | 'closure_review'
  | 'closed'
  | 'rejected'
  | 'reopened';

export interface CorrectiveActionRow {
  readonly id: string;
  readonly detectionFolio: string;
  readonly walkthroughFolio: string;
  readonly detectionType: CorrectiveDetectionType;
  readonly description: string;
  readonly companyName: string;
  readonly branchName: string;
  readonly areaName: string;
  readonly status: CorrectiveActionStatus;
  readonly correctivePlan: string | null;
  readonly currentCommitmentDate: string | null;
  readonly commitmentSequence: number | null;
  readonly assignedAt: string;
  readonly tourDate: string;
}

export interface CorrectiveActionDetailRow extends CorrectiveActionRow {
  readonly inspectorName: string;
  readonly inspectedAt: string;
  readonly responsibleName: string;
  readonly photoUrl: string | null;
  readonly photoCaption: string;
  readonly signatureUrl: string | null;
  readonly resolutionPhotoUrl: string | null;
  readonly respondedAt: string | null;
  readonly resolutionResolvedAt: string | null;
  readonly resolutionDurationMinutes: number | null;
  readonly closureRejectionReason: string | null;
  readonly commitmentHistory: readonly CommitmentHistoryItem[];
}

export interface FindCorrectiveActionsFilter {
  readonly responsibleId?: string;
}
