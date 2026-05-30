import { formatCommitmentDateLabel, formatTourDateTimeLabel } from '../../../tours/application/helpers/tour-date.helper';
import type { CorrectiveActionStatus } from '../interfaces/corrective.interface';
import type { CommitmentHistoryItem } from '../interfaces/commitment-history.interface';
import { calculateResolutionDurationMinutes } from './resolution-duration.helper';

interface CommitmentHistorySource {
  readonly sequenceNumber: number;
  readonly signedAt: Date;
  readonly commitmentDate: Date;
  readonly changeReason: string | null;
  readonly resolutionPhotoBlobId: string | null;
  readonly resolutionPhotoBlob: { createdAt: Date } | null;
}

function formatResolutionDurationLabel(minutes: number): string {
  if (minutes < 1) {
    return 'Menos de 1 minuto';
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
}

function resolveCommitmentLabel(sequenceNumber: number): string {
  return sequenceNumber === 0
    ? 'Fecha compromiso (F0)'
    : `Reprogramación F${sequenceNumber}`;
}

function resolveClosureRejectionReasonForHistory(
  status: CorrectiveActionStatus,
  commitments: readonly CommitmentHistorySource[],
  index: number,
): string | null {
  if (status !== 'reopened') {
    return null;
  }

  const sortedDesc = [...commitments].sort(
    (left, right) => right.sequenceNumber - left.sequenceNumber,
  );
  const latest = sortedDesc[0];
  const current = commitments[index];

  if (!current.changeReason?.trim()) {
    return null;
  }

  if (sortedDesc.length === 1 && !current.resolutionPhotoBlobId) {
    return current.changeReason.trim();
  }

  if (
    latest.sequenceNumber > current.sequenceNumber &&
    !current.resolutionPhotoBlobId
  ) {
    return current.changeReason.trim();
  }

  return null;
}

export function mapCommitmentHistory(
  status: CorrectiveActionStatus,
  commitments: readonly CommitmentHistorySource[],
): CommitmentHistoryItem[] {
  if (commitments.length === 0) {
    return [];
  }

  const latestSequence = Math.max(
    ...commitments.map((commitment) => commitment.sequenceNumber),
  );

  return commitments.map((commitment, index) => {
    const resolutionDurationMinutes = commitment.resolutionPhotoBlob
      ? calculateResolutionDurationMinutes(
          commitment.signedAt,
          commitment.resolutionPhotoBlob.createdAt,
        )
      : null;

    const closureRejectionReason = resolveClosureRejectionReasonForHistory(
      status,
      commitments,
      index,
    );

    const dateChangeReason =
      commitment.sequenceNumber > 0 && commitment.changeReason?.trim()
        ? commitment.changeReason.trim()
        : null;

    return {
      sequenceNumber: commitment.sequenceNumber,
      label: resolveCommitmentLabel(commitment.sequenceNumber),
      commitmentDate: formatCommitmentDateLabel(commitment.commitmentDate) ?? '',
      signedAt: formatTourDateTimeLabel(commitment.signedAt),
      dateChangeReason: closureRejectionReason ? null : dateChangeReason,
      closureRejectionReason,
      resolutionResolvedAt: commitment.resolutionPhotoBlob
        ? formatTourDateTimeLabel(commitment.resolutionPhotoBlob.createdAt)
        : null,
      resolutionDurationLabel: resolutionDurationMinutes
        ? formatResolutionDurationLabel(resolutionDurationMinutes)
        : null,
      isCurrent: commitment.sequenceNumber === latestSequence,
    };
  });
}

export function resolveClosureRejectionReasonFromHistory(
  status: CorrectiveActionStatus,
  commitments: readonly CommitmentHistorySource[],
): string | null {
  const history = mapCommitmentHistory(status, commitments);
  const rejectionEntry = [...history]
    .reverse()
    .find((entry) => entry.closureRejectionReason);

  return rejectionEntry?.closureRejectionReason ?? null;
}
