export type TourDetectionTypeInput = 'unsafe_act' | 'unsafe_condition';

export type TourPeriod = 'day' | 'week';

export type TourCorrectiveActionStatus =
  | 'pending_acceptance'
  | 'open'
  | 'pending'
  | 'expired'
  | 'closure_review'
  | 'closed'
  | 'rejected'
  | 'reopened';

export interface RegisterWalkthroughDetectionInput {
  readonly folio: string;
  readonly companyId: string;
  readonly branchId: string;
  readonly areaId: string;
  readonly detectionType: TourDetectionTypeInput;
  readonly description: string;
  readonly responsibleId: string;
  readonly evidencePhotoDataUrl?: string;
}

export interface RegisterWalkthroughInput {
  readonly inspectorId: string;
  readonly folio: string;
  readonly startedAt: Date;
  readonly detections: readonly RegisterWalkthroughDetectionInput[];
}

export interface RegisterWalkthroughResult {
  readonly id: string;
  readonly folio: string;
  readonly status: 'completed';
  readonly detectionsCount: number;
  readonly finishedAt: string;
}

export interface TourCorrectiveActionRow {
  readonly id: string;
  readonly walkthroughFolio: string;
  readonly detectionFolio: string;
  readonly detectionType: TourDetectionTypeInput;
  readonly description: string;
  readonly companyName: string;
  readonly branchName: string;
  readonly areaName: string;
  readonly status: TourCorrectiveActionStatus;
  readonly responsible: string;
  readonly tourDate: string;
  readonly weekdayLabel: string;
  readonly weekdayOrder: number;
  readonly commitmentDate: string | null;
  readonly evidencePhotoUrl: string | null;
  readonly resolutionPhotoUrl: string | null;
}
