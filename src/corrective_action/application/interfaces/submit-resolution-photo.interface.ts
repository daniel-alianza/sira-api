import type { CorrectiveActionStatus } from './corrective.interface';

export interface SubmitResolutionPhotoInput {
  readonly actionId: string;
  readonly userId: string;
  readonly resolutionPhotoDataUrl: string;
}

export interface SubmitResolutionPhotoResult {
  readonly id: string;
  readonly status: CorrectiveActionStatus;
  readonly resolutionPhotoBlobId: string;
  readonly resolutionResolvedAt: string;
  readonly resolutionDurationMinutes: number;
}
