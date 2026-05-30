import type { CorrectiveActionStatus } from './corrective.interface';

export interface RespondCorrectiveActionInput {
  readonly actionId: string;
  readonly userId: string;
  readonly correctivePlan: string;
  readonly commitmentDate: string;
  readonly signatureDataUrl: string;
  readonly resolutionPhotoDataUrl?: string;
  readonly changeReason?: string;
}

export interface CorrectiveActionForRespond {
  readonly id: string;
  readonly status: CorrectiveActionStatus;
  readonly responsibleId: string;
  readonly latestCommitmentId: string | null;
  readonly latestSequenceNumber: number | null;
  readonly latestCommitmentHasResolution: boolean;
}

export interface RespondCorrectiveActionResult {
  readonly id: string;
  readonly status: CorrectiveActionStatus;
  readonly commitmentSequence: number;
  readonly resolutionPhotoBlobId?: string;
}
