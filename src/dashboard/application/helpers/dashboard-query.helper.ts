import { CorrectiveActionStatus, DetectionType } from '../../../../generated/prisma/client';
import type { Prisma } from '../../../../generated/prisma/client';
import type { DashboardQueryFilter } from '../interfaces/dashboard.interface';

const API_TO_PRISMA_STATUS: Record<string, CorrectiveActionStatus> = {
  pending_acceptance: CorrectiveActionStatus.PENDING_ACCEPTANCE,
  open: CorrectiveActionStatus.OPEN,
  pending: CorrectiveActionStatus.PENDING,
  expired: CorrectiveActionStatus.EXPIRED,
  closure_review: CorrectiveActionStatus.CLOSURE_REVIEW,
  closed: CorrectiveActionStatus.CLOSED,
  rejected: CorrectiveActionStatus.REJECTED,
  reopened: CorrectiveActionStatus.REOPENED,
};

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function resolveDefaultPeriod(timeZone: string): {
  readonly from: string;
  readonly to: string;
} {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const to = formatter.format(now);
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 30);
  const from = formatter.format(fromDate);

  return { from, to };
}

export function buildDashboardPeriodLabel(
  from: string,
  to: string,
  timeZone: string,
): string {
  const fromLabel = formatShortDashboardDateLabel(from, timeZone);
  const toLabel = formatShortDashboardDateLabel(to, timeZone);

  return `en el periodo (${fromLabel} – ${toLabel})`;
}

function formatShortDashboardDateLabel(
  calendarDate: string,
  timeZone: string,
): string {
  const [year, month, day] = calendarDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  return new Intl.DateTimeFormat('es-MX', {
    timeZone,
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function buildOperationalQueueWhereInput(
  filter: DashboardQueryFilter,
): Prisma.CorrectiveActionWhereInput {
  const detectionFilter: Prisma.DetectionWhereInput = {};

  if (filter.companyId) {
    detectionFilter.companyId = filter.companyId;
  }

  if (filter.areaId) {
    detectionFilter.areaId = filter.areaId;
  }

  if (filter.responsibleId) {
    detectionFilter.responsibleId = filter.responsibleId;
  }

  if (filter.detectionType) {
    detectionFilter.type =
      filter.detectionType === 'unsafe_act'
        ? DetectionType.UNSAFE_ACT
        : DetectionType.UNSAFE_CONDITION;
  }

  if (Object.keys(detectionFilter).length === 0) {
    return {};
  }

  return { detection: detectionFilter };
}

export function buildActionWhereInput(
  filter: DashboardQueryFilter,
  rangeStart: Date,
  rangeEnd: Date,
): Prisma.CorrectiveActionWhereInput {
  const prismaStatus = filter.status
    ? API_TO_PRISMA_STATUS[filter.status]
    : undefined;

  return {
    createdAt: {
      gte: rangeStart,
      lte: rangeEnd,
    },
    ...(prismaStatus ? { status: prismaStatus } : {}),
    detection: {
      ...(filter.companyId ? { companyId: filter.companyId } : {}),
      ...(filter.areaId ? { areaId: filter.areaId } : {}),
      ...(filter.responsibleId ? { responsibleId: filter.responsibleId } : {}),
      ...(filter.detectionType
        ? {
            type:
              filter.detectionType === 'unsafe_act'
                ? DetectionType.UNSAFE_ACT
                : DetectionType.UNSAFE_CONDITION,
          }
        : {}),
    },
  };
}

export function computeComplianceRate(
  closedActions: number,
  actionsTotal: number,
): number {
  if (actionsTotal === 0) {
    return 0;
  }

  return Math.round((closedActions / actionsTotal) * 100);
}

export function truncateAreaLabel(name: string): string {
  return name.length > 8 ? `${name.slice(0, 6)}.` : name;
}

const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

export function getMonthLabel(date: Date): string {
  return MONTH_LABELS[date.getUTCMonth()] ?? '—';
}
