export interface CommitmentHistoryItem {
  readonly sequenceNumber: number;
  readonly label: string;
  readonly commitmentDate: string;
  readonly signedAt: string;
  readonly dateChangeReason: string | null;
  readonly closureRejectionReason: string | null;
  readonly resolutionResolvedAt: string | null;
  readonly resolutionDurationLabel: string | null;
  readonly isCurrent: boolean;
}
