export interface SubmitDetectionEvidenceInput {
  readonly actionId: string;
  readonly userId: string;
  readonly evidencePhotoDataUrl: string;
}

export interface SubmitDetectionEvidenceResult {
  readonly evidencePhotoUrl: string;
}

export interface CorrectiveActionForDetectionEvidence {
  readonly id: string;
  readonly detectionId: string;
  readonly hasDetectionEvidence: boolean;
}
