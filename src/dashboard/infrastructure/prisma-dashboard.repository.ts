import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CorrectiveActionStatus,
  type Prisma,
} from '../../../generated/prisma/client';
import type { EnvVariables } from '../../config/env-validation';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  formatCommitmentDateLabel,
  formatTourDateLabel,
} from '../../tours/application/helpers/tour-date.helper';
import {
  countBusinessDaysBetween,
  listCalendarDaysInRange,
  resolveCurrentWeekPeriod,
  resolveWeekdayShortLabel,
  TIME_METRICS_BASIS_LABEL,
  zonedLocalDateTimeToUtc,
} from '../../common/days-and-hours-work';
import {
  buildDashboardOpenActions,
  formatWalkthroughDateOnly,
} from '../application/helpers/build-dashboard-open-actions.helper';
import {
  buildDashboardIaSlimContext,
  buildDashboardIaSlimFilters,
} from '../application/helpers/build-dashboard-ia-slim-context.helper';
import {
  buildActionWhereInput,
  buildOperationalQueueWhereInput,
  computeComplianceRate,
  getMonthLabel,
  parseDateOnly,
  resolveDefaultPeriod,
  truncateAreaLabel,
} from '../application/helpers/dashboard-query.helper';
import type {
  DashboardIaContext,
  DashboardOverview,
  DashboardQueryFilter,
} from '../application/interfaces/dashboard.interface';
import type {
  DashboardIaContextQuery,
  DashboardRepositoryPort,
} from '../application/interfaces/dashboard.port';

const STATUS_DISTRIBUTION_LABELS: Record<string, string> = {
  CLOSED: 'Cerrada',
  OPEN: 'Abierta / Pendiente',
  PENDING: 'Abierta / Pendiente',
  REOPENED: 'Abierta / Pendiente',
  EXPIRED: 'Expirada',
  PENDING_ACCEPTANCE: 'Pend. aceptación',
  CLOSURE_REVIEW: 'En rev. cierre',
  REJECTED: 'Rechazada',
};

@Injectable()
export class PrismaDashboardRepository implements DashboardRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvVariables, true>,
  ) {}

  async getOverview(filter: DashboardQueryFilter): Promise<DashboardOverview> {
    const context = await this.buildDashboardData(filter);

    return {
      period: context.period,
      firstWalkthroughDate: context.firstWalkthroughDate,
      filterOptions: context.filterOptions,
      kpis: context.kpis,
      openActions: context.openActions,
      areaCompliance: context.areaCompliance,
      commitmentDateRequests: context.commitmentDateRequests,
      operationalQueues: context.operationalQueues,
      charts: context.charts,
    };
  }

  async getIaContext(query: DashboardIaContextQuery): Promise<DashboardIaContext> {
    const timeZone = this.configService.get('TIMEZONE', { infer: true });
    const weekPeriod = resolveCurrentWeekPeriod(timeZone);
    const weekFilter: DashboardQueryFilter = {
      companyId: query.filter.companyId,
      areaId: query.filter.areaId,
      responsibleId: query.filter.responsibleId,
      dateFrom: weekPeriod.from,
      dateTo: weekPeriod.to,
    };
    const context = await this.buildDashboardData(weekFilter);
    const topExpiredAreas = context.areaCompliance
      .filter((area) => area.expired > 0)
      .sort((left, right) => right.expired - left.expired)
      .slice(0, 3)
      .map((area) => `${area.name} (${area.expired})`);

    return buildDashboardIaSlimContext({
      analysisScope: query.analysisScope,
      analysisScopeLabel: query.analysisScopeLabel,
      period: {
        from: weekPeriod.from,
        to: weekPeriod.to,
        label: weekPeriod.label,
      },
      timeMetricsBasis: TIME_METRICS_BASIS_LABEL,
      filters: buildDashboardIaSlimFilters(query.filter),
      kpis: context.kpis,
      areaCompliance: context.areaCompliance,
      commitmentDateRequestsCount: context.commitmentDateRequests.length,
      operationalQueues: context.operationalQueues,
      weeklyTrend: buildWeeklyActionsTrend(
        context.actionsForTrend,
        weekPeriod.from,
        weekPeriod.to,
        timeZone,
      ),
      statusDistribution: context.charts.statusDistribution,
      upcomingDue: context.charts.upcomingDue,
      topExpiredAreas,
    });
  }

  private async buildDashboardData(filter: DashboardQueryFilter) {
    const resolvedTimeZone = this.configService.get('TIMEZONE', { infer: true });
    const period = resolveDefaultPeriod(resolvedTimeZone);
    const dateFrom = filter.dateFrom ?? period.from;
    const dateTo = filter.dateTo ?? period.to;
    const rangeStart = parseDateOnly(dateFrom);
    const rangeEnd = parseDateOnly(dateTo);
    rangeEnd.setUTCHours(23, 59, 59, 999);

    const actionWhere = buildActionWhereInput(filter, rangeStart, rangeEnd);
    const operationalQueueWhere = buildOperationalQueueWhereInput(filter);
    const now = new Date();

    const [
      filterOptions,
      firstWalkthrough,
      statusGroups,
      walkthroughsCount,
      actions,
      closedActionsForAvg,
      commitmentChanges,
      pendingSignatureActions,
      closureReviewActions,
      expiredActions,
      upcomingDueActions,
    ] = await Promise.all([
      this.loadFilterOptions(filter),
      this.prisma.walkthrough.findFirst({
        orderBy: { startedAt: 'asc' },
        select: { startedAt: true },
      }),
      this.prisma.correctiveAction.groupBy({
        by: ['status'],
        where: actionWhere,
        _count: { _all: true },
      }),
      this.prisma.walkthrough.count({
        where: {
          startedAt: { gte: rangeStart, lte: rangeEnd },
          ...(filter.companyId || filter.areaId || filter.responsibleId
            ? {
                detections: {
                  some: {
                    ...(filter.companyId ? { companyId: filter.companyId } : {}),
                    ...(filter.areaId ? { areaId: filter.areaId } : {}),
                    ...(filter.responsibleId
                      ? { responsibleId: filter.responsibleId }
                      : {}),
                  },
                },
              }
            : {}),
        },
      }),
      this.prisma.correctiveAction.findMany({
        where: actionWhere,
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          currentCommitmentDate: true,
          correctivePlan: true,
          detection: {
            select: {
              folio: true,
              description: true,
              createdAt: true,
              areaId: true,
              responsibleId: true,
              evidencePhotoBlobId: true,
              area: { select: { name: true } },
              responsible: { select: { name: true } },
              walkthrough: { select: { folio: true } },
            },
          },
        },
      }),
      this.prisma.correctiveAction.findMany({
        where: {
          ...actionWhere,
          status: CorrectiveActionStatus.CLOSED,
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.loadCommitmentDateRequests(actionWhere),
      this.loadPendingSignatureActions(operationalQueueWhere),
      this.loadClosureReviewActions(operationalQueueWhere),
      this.loadExpiredActions(operationalQueueWhere, now, resolvedTimeZone),
      this.loadUpcomingDueActions(actionWhere, now),
    ]);

    const kpis = buildKpis(
      statusGroups,
      walkthroughsCount,
      closedActionsForAvg,
      actions,
      resolvedTimeZone,
    );
    const areaCompliance = buildAreaCompliance(actions);
    const charts = buildCharts(
      actions,
      areaCompliance,
      statusGroups,
      upcomingDueActions,
      now,
      resolvedTimeZone,
    );

    const firstWalkthroughDate = firstWalkthrough
      ? formatWalkthroughDateOnly(firstWalkthrough.startedAt, resolvedTimeZone)
      : null;

    return {
      period: { from: dateFrom, to: dateTo },
      firstWalkthroughDate,
      filterOptions,
      kpis,
      openActions: buildDashboardOpenActions(actions),
      areaCompliance,
      commitmentDateRequests: commitmentChanges,
      operationalQueues: {
        pendingSignature: pendingSignatureActions,
        closureReview: closureReviewActions,
        expiredActions,
      },
      charts,
      actionsForTrend: actions,
    };
  }

  private async loadFilterOptions(filter?: DashboardQueryFilter) {
    const [companies, areas, responsibles] = await Promise.all([
      this.prisma.company.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      this.prisma.area.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      this.prisma.user.findMany({
        where: {
          isActive: true,
          ...(filter?.companyId ? { companyId: filter.companyId } : {}),
          ...(filter?.areaId ? { areaId: filter.areaId } : {}),
        },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
    ]);

    return {
      companies: companies.map((item) => ({
        value: item.id,
        label: item.name,
      })),
      areas: areas.map((item) => ({
        value: item.id,
        label: item.name,
      })),
      responsibles: responsibles.map((item) => ({
        value: item.id,
        label: item.name,
      })),
    };
  }

  private async loadCommitmentDateRequests(
    actionWhere: Prisma.CorrectiveActionWhereInput,
  ) {
    const commitments = await this.prisma.correctiveCommitment.findMany({
      where: {
        sequenceNumber: { gt: 0 },
        correctiveAction: actionWhere,
      },
      orderBy: { signedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        sequenceNumber: true,
        commitmentDate: true,
        changeReason: true,
        signedAt: true,
        correctiveAction: {
          select: {
            status: true,
            currentCommitmentDate: true,
            detection: {
              select: {
                folio: true,
                description: true,
                area: { select: { name: true } },
                responsible: { select: { name: true } },
                walkthrough: { select: { folio: true } },
              },
            },
            correctiveCommitments: {
              where: { sequenceNumber: 0 },
              take: 1,
              select: { commitmentDate: true },
            },
          },
        },
      },
    });

    return commitments.map((commitment) => {
      const action = commitment.correctiveAction;
      const initialCommitment = action.correctiveCommitments[0] ?? null;

      return {
        id: commitment.id,
        actionFolio: action.detection.folio,
        walkthroughFolio: action.detection.walkthrough.folio,
        responsible: action.detection.responsible.name,
        area: action.detection.area.name,
        description: action.detection.description,
        initialDate: formatCommitmentDateLabel(
          initialCommitment?.commitmentDate ?? commitment.commitmentDate,
        ) ?? '—',
        currentDate:
          formatCommitmentDateLabel(action.currentCommitmentDate) ?? '—',
        requestedDate: formatCommitmentDateLabel(commitment.commitmentDate) ?? '—',
        changeLabel: `F${commitment.sequenceNumber}`,
        reason: commitment.changeReason ?? 'Sin motivo registrado',
        status:
          action.status === CorrectiveActionStatus.CLOSURE_REVIEW
            ? ('review' as const)
            : ('pending' as const),
      };
    });
  }

  private async loadPendingSignatureActions(
    queueWhere: Prisma.CorrectiveActionWhereInput,
  ) {
    const actions = await this.prisma.correctiveAction.findMany({
      where: {
        ...queueWhere,
        status: CorrectiveActionStatus.PENDING_ACCEPTANCE,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        currentCommitmentDate: true,
        detection: {
          select: {
            folio: true,
            area: { select: { name: true } },
            responsible: { select: { name: true } },
          },
        },
      },
    });

    return actions.map((action) => ({
      id: action.id,
      actionFolio: action.detection.folio,
      responsible: action.detection.responsible.name,
      area: action.detection.area.name,
      assignedAt: formatTourDateLabel(action.createdAt),
      commitmentDate:
        formatCommitmentDateLabel(action.currentCommitmentDate) ?? 'Sin fecha',
    }));
  }

  private async loadClosureReviewActions(
    queueWhere: Prisma.CorrectiveActionWhereInput,
  ) {
    const actions = await this.prisma.correctiveAction.findMany({
      where: {
        ...queueWhere,
        status: CorrectiveActionStatus.CLOSURE_REVIEW,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        updatedAt: true,
        status: true,
        detection: {
          select: {
            folio: true,
            area: { select: { name: true } },
            responsible: { select: { name: true } },
          },
        },
      },
    });

    return actions.map((action) => ({
      id: action.id,
      actionFolio: action.detection.folio,
      responsible: action.detection.responsible.name,
      area: action.detection.area.name,
      requestedAt: formatTourDateLabel(action.updatedAt),
      legend:
        action.status === CorrectiveActionStatus.EXPIRED
          ? ('Expirado' as const)
          : ('Pendiente' as const),
    }));
  }

  private async loadExpiredActions(
    queueWhere: Prisma.CorrectiveActionWhereInput,
    now: Date,
    timeZone: string,
  ) {
    const actions = await this.prisma.correctiveAction.findMany({
      where: {
        ...queueWhere,
        status: CorrectiveActionStatus.EXPIRED,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        currentCommitmentDate: true,
        detection: {
          select: {
            folio: true,
            area: { select: { name: true } },
            responsible: { select: { name: true } },
          },
        },
      },
    });

    return actions.map((action) => {
      const commitmentDate = action.currentCommitmentDate;
      const daysOverdue =
        commitmentDate !== null
          ? Math.max(
              0,
              Math.floor(
                countBusinessDaysBetween(commitmentDate, now, timeZone),
              ),
            )
          : 0;

      return {
        id: action.id,
        actionFolio: action.detection.folio,
        responsible: action.detection.responsible.name,
        area: action.detection.area.name,
        commitmentDate:
          formatCommitmentDateLabel(action.currentCommitmentDate) ?? '—',
        daysOverdue,
      };
    });
  }

  private async loadUpcomingDueActions(
    actionWhere: Prisma.CorrectiveActionWhereInput,
    now: Date,
  ) {
    const horizon = new Date(now);
    horizon.setUTCDate(horizon.getUTCDate() + 30);

    return this.prisma.correctiveAction.findMany({
      where: {
        ...actionWhere,
        currentCommitmentDate: {
          gte: now,
          lte: horizon,
        },
        status: {
          in: [
            CorrectiveActionStatus.OPEN,
            CorrectiveActionStatus.PENDING,
            CorrectiveActionStatus.REOPENED,
            CorrectiveActionStatus.PENDING_ACCEPTANCE,
          ],
        },
      },
      select: {
        currentCommitmentDate: true,
      },
    });
  }
}

function buildKpis(
  statusGroups: { status: CorrectiveActionStatus; _count: { _all: number } }[],
  walkthroughsCount: number,
  closedActions: { createdAt: Date; updatedAt: Date }[],
  allActions: { status: CorrectiveActionStatus; detection: { responsibleId: string } }[],
  timeZone: string,
) {
  const countByStatus = new Map(
    statusGroups.map((group) => [group.status, group._count._all]),
  );
  const getCount = (status: CorrectiveActionStatus): number =>
    countByStatus.get(status) ?? 0;

  const openActions =
    getCount(CorrectiveActionStatus.OPEN) +
    getCount(CorrectiveActionStatus.PENDING) +
    getCount(CorrectiveActionStatus.REOPENED);

  const totalActions = statusGroups.reduce(
    (sum, group) => sum + group._count._all,
    0,
  );

  const notRespondedUsers = new Set(
    allActions
      .filter((a) => a.status === CorrectiveActionStatus.PENDING_ACCEPTANCE)
      .map((a) => a.detection.responsibleId),
  ).size;

  const notSignedUsers = new Set(
    allActions
      .filter((a) => a.status === CorrectiveActionStatus.OPEN)
      .map((a) => a.detection.responsibleId),
  ).size;

  const avgClosureDays =
    closedActions.length === 0
      ? 0
      : Math.round(
          (closedActions.reduce((sum, action) => {
            return (
              sum +
              countBusinessDaysBetween(
                action.createdAt,
                action.updatedAt,
                timeZone,
              )
            );
          }, 0) /
            closedActions.length) *
            10,
        ) / 10;

  return {
    totalActions,
    openActions,
    closedActions: getCount(CorrectiveActionStatus.CLOSED),
    pendingAcceptance: getCount(CorrectiveActionStatus.PENDING_ACCEPTANCE),
    expiredActions: getCount(CorrectiveActionStatus.EXPIRED),
    closureReview: getCount(CorrectiveActionStatus.CLOSURE_REVIEW),
    rejectedClosures: getCount(CorrectiveActionStatus.REJECTED),
    walkthroughsPeriod: walkthroughsCount,
    avgClosureDays,
    notRespondedUsers,
    notSignedUsers,
  };
}

function buildAreaCompliance(
  actions: {
    status: CorrectiveActionStatus;
    detection: {
      areaId: string;
      area: { name: string };
    };
  }[],
) {
  const areaMap = new Map<
    string,
    {
      id: string;
      name: string;
      actionsTotal: number;
      closedActions: number;
      expired: number;
    }
  >();

  for (const action of actions) {
    const areaId = action.detection.areaId;
    const current = areaMap.get(areaId) ?? {
      id: areaId,
      name: action.detection.area.name,
      actionsTotal: 0,
      closedActions: 0,
      expired: 0,
    };

    current.actionsTotal += 1;

    if (action.status === CorrectiveActionStatus.CLOSED) {
      current.closedActions += 1;
    }

    if (action.status === CorrectiveActionStatus.EXPIRED) {
      current.expired += 1;
    }

    areaMap.set(areaId, current);
  }

  return [...areaMap.values()]
    .map((area) => {
      const compliance = computeComplianceRate(area.closedActions, area.actionsTotal);
      return {
        id: area.id,
        name: area.name,
        compliance,
        nonCompliance: 100 - compliance,
        actionsTotal: area.actionsTotal,
        closedActions: area.closedActions,
        expired: area.expired,
        trend: '—',
      };
    })
    .sort((left, right) => right.actionsTotal - left.actionsTotal);
}

function buildCharts(
  actions: {
    status: CorrectiveActionStatus;
    createdAt: Date;
    updatedAt: Date;
    currentCommitmentDate: Date | null;
  }[],
  areaCompliance: {
    name: string;
    compliance: number;
    nonCompliance: number;
    actionsTotal: number;
    closedActions: number;
  }[],
  statusGroups: { status: CorrectiveActionStatus; _count: { _all: number } }[],
  upcomingDueActions: { currentCommitmentDate: Date | null }[],
  now: Date,
  timeZone: string,
) {
  const monthBuckets = buildMonthBuckets(now, 5);
  const actionsTrend = monthBuckets.map((bucket) => {
    const created = actions.filter(
      (action) =>
        action.createdAt >= bucket.start && action.createdAt <= bucket.end,
    ).length;
    const closed = actions.filter(
      (action) =>
        action.status === CorrectiveActionStatus.CLOSED &&
        action.updatedAt >= bucket.start &&
        action.updatedAt <= bucket.end,
    ).length;
    const expired = actions.filter(
      (action) =>
        action.status === CorrectiveActionStatus.EXPIRED &&
        action.updatedAt >= bucket.start &&
        action.updatedAt <= bucket.end,
    ).length;

    return {
      month: bucket.label,
      created,
      closed,
      expired,
    };
  });

  const complianceByArea = areaCompliance.map((area) => ({
    label: area.name,
    compliance: area.compliance,
    nonCompliance: area.nonCompliance,
    actionsTotal: area.actionsTotal,
    closedActions: area.closedActions,
  }));

  const groupedStatus = new Map<string, number>();
  for (const group of statusGroups) {
    const label = STATUS_DISTRIBUTION_LABELS[group.status] ?? group.status;
    groupedStatus.set(label, (groupedStatus.get(label) ?? 0) + group._count._all);
  }

  const statusDistribution = [...groupedStatus.entries()].map(
    ([label, value]) => ({
      label,
      value,
      color:
        label === 'Cerrada'
          ? '#00C4B3'
          : label === 'Expirada'
            ? '#FF4D00'
            : label === 'Pend. aceptación'
              ? '#94a3b8'
              : label === 'En rev. cierre'
                ? '#64748b'
                : '#0A2240',
    }),
  );

  const upcomingDue = buildUpcomingDueBuckets(upcomingDueActions, now, timeZone);

  return {
    actionsTrend,
    complianceByArea,
    statusDistribution,
    upcomingDue,
  };
}

function buildMonthBuckets(referenceDate: Date, count: number) {
  const buckets: {
    start: Date;
    end: Date;
    label: string;
  }[] = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const start = new Date(
      Date.UTC(
        referenceDate.getUTCFullYear(),
        referenceDate.getUTCMonth() - index,
        1,
      ),
    );
    const end = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );

    buckets.push({
      start,
      end,
      label: getMonthLabel(start),
    });
  }

  return buckets;
}

function buildWeeklyActionsTrend(
  actions: {
    status: CorrectiveActionStatus;
    createdAt: Date;
    updatedAt: Date;
  }[],
  from: string,
  to: string,
  timeZone: string,
) {
  return listCalendarDaysInRange(from, to).map((calendarDate) => {
    const dayStart = zonedLocalDateTimeToUtc(calendarDate, 0, 0, timeZone);
    const dayEnd = zonedLocalDateTimeToUtc(calendarDate, 23, 59, timeZone);
    dayEnd.setSeconds(59, 999);

    return {
      day: resolveWeekdayShortLabel(calendarDate, timeZone),
      created: actions.filter(
        (action) =>
          action.createdAt >= dayStart && action.createdAt <= dayEnd,
      ).length,
      closed: actions.filter(
        (action) =>
          action.status === CorrectiveActionStatus.CLOSED &&
          action.updatedAt >= dayStart &&
          action.updatedAt <= dayEnd,
      ).length,
      expired: actions.filter(
        (action) =>
          action.status === CorrectiveActionStatus.EXPIRED &&
          action.updatedAt >= dayStart &&
          action.updatedAt <= dayEnd,
      ).length,
    };
  });
}

function buildUpcomingDueBuckets(
  actions: { currentCommitmentDate: Date | null }[],
  now: Date,
  timeZone: string,
) {
  function countInRange(minDays: number, maxDays: number): number {
    return actions.filter((action) => {
      if (!action.currentCommitmentDate) {
        return false;
      }

      const diffDays = Math.ceil(
        countBusinessDaysBetween(now, action.currentCommitmentDate, timeZone),
      );

      return diffDays >= minDays && diffDays <= maxDays;
    }).length;
  }

  return [
    { days: '1-3 días', count: countInRange(1, 3) },
    { days: '4-7 días', count: countInRange(4, 7) },
    { days: '8-15 días', count: countInRange(8, 15) },
    { days: '16-30 días', count: countInRange(16, 30) },
  ];
}
