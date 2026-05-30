import {
  CorrectiveActionStatus,
  DetectionType,
} from '../../../../generated/prisma/client';
import type {
  TourCorrectiveActionStatus,
  TourDetectionTypeInput,
} from '../interfaces/tours.interface';

export function mapDetectionTypeToPrisma(
  detectionType: TourDetectionTypeInput,
): DetectionType {
  if (detectionType === 'unsafe_act') {
    return DetectionType.UNSAFE_ACT;
  }

  return DetectionType.UNSAFE_CONDITION;
}

export function mapDetectionTypeFromPrisma(
  detectionType: DetectionType,
): TourDetectionTypeInput {
  if (detectionType === DetectionType.UNSAFE_ACT) {
    return 'unsafe_act';
  }

  return 'unsafe_condition';
}

export function mapCorrectiveActionStatusFromPrisma(
  status: CorrectiveActionStatus,
): TourCorrectiveActionStatus {
  const statusMap: Record<CorrectiveActionStatus, TourCorrectiveActionStatus> =
    {
      [CorrectiveActionStatus.PENDING_ACCEPTANCE]: 'pending_acceptance',
      [CorrectiveActionStatus.OPEN]: 'open',
      [CorrectiveActionStatus.PENDING]: 'pending',
      [CorrectiveActionStatus.EXPIRED]: 'expired',
      [CorrectiveActionStatus.CLOSURE_REVIEW]: 'closure_review',
      [CorrectiveActionStatus.CLOSED]: 'closed',
      [CorrectiveActionStatus.REJECTED]: 'rejected',
      [CorrectiveActionStatus.REOPENED]: 'reopened',
    };

  return statusMap[status];
}
