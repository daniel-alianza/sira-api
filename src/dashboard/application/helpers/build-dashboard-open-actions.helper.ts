import { CorrectiveActionStatus } from '../../../../generated/prisma/client';
import { buildMediaResourcePath } from '../../../media/application/helpers/build-media-resource-path.helper';
import { mapCorrectiveActionStatusFromPrisma } from '../../../tours/application/mappers/tours-enum.mapper';
import type { DashboardOpenActionItem } from '../interfaces/dashboard.interface';

const OPEN_ACTIONS_PREVIEW_LIMIT = 12;

const ACTIVE_OPEN_STATUSES: readonly CorrectiveActionStatus[] = [
  CorrectiveActionStatus.OPEN,
  CorrectiveActionStatus.PENDING,
  CorrectiveActionStatus.REOPENED,
];

interface DashboardActionForOpenPreview {
  readonly id: string;
  readonly status: CorrectiveActionStatus;
  readonly createdAt: Date;
  readonly detection: {
    readonly folio: string;
    readonly description: string;
    readonly evidencePhotoBlobId: string | null;
    readonly area: { readonly name: string };
    readonly responsible: { readonly name: string };
    readonly walkthrough: { readonly folio: string };
  };
}

export function buildDashboardOpenActions(
  actions: readonly DashboardActionForOpenPreview[],
): DashboardOpenActionItem[] {
  return actions
    .filter((action) => ACTIVE_OPEN_STATUSES.includes(action.status))
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, OPEN_ACTIONS_PREVIEW_LIMIT)
    .map((action) => ({
      id: action.id,
      detectionFolio: action.detection.folio,
      walkthroughFolio: action.detection.walkthrough.folio,
      description: action.detection.description,
      status: mapCorrectiveActionStatusFromPrisma(action.status),
      areaName: action.detection.area.name,
      responsibleName: action.detection.responsible.name,
      evidencePhotoUrl: buildMediaResourcePath(action.detection.evidencePhotoBlobId),
    }));
}

export function formatWalkthroughDateOnly(
  date: Date,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
