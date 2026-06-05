import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CorrectiveActionStatus,
  Status,
  type Prisma,
} from '../../../generated/prisma/client';
import type { EnvVariables } from '../../config/env-validation';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { countBusinessDaysBetween } from '../../common/days-and-hours-work';
import {
  buildActionWhereInput,
  parseDateOnly,
} from '../../dashboard/application/helpers/dashboard-query.helper';
import { resolveClosureRejectionReasonFromHistory } from '../../corrective_action/application/helpers/map-commitment-history.helper';
import { calculateResolutionDurationMinutes } from '../../corrective_action/application/helpers/resolution-duration.helper';
import {
  formatCommitmentDateLabel,
  formatTourDateLabel,
  formatTourDateTimeLabel,
} from '../../tours/application/helpers/tour-date.helper';
import { mapCorrectiveActionStatusFromPrisma } from '../../tours/application/mappers/tours-enum.mapper';
import { resolveReportsPeriod } from '../application/helpers/resolve-reports-period.helper';
import {
  resolveClosedOnTimeLabel,
  resolveCorrectiveStatusLabel,
  resolveDeadlineLegend,
  resolveDetectionTypeLabel,
} from '../application/helpers/reports-labels.helper';
import type {
  ReportsExportDataset,
  ReportsKpis,
  ReportsPreview,
  ReportsQueryFilter,
  ReportsSheetCounts,
} from '../application/interfaces/reports.interface';
import type { ReportsRepositoryPort } from '../application/interfaces/reports.port';

@Injectable()
export class PrismaReportsRepository implements ReportsRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvVariables, true>,
  ) {}

  async getPreview(filter: ReportsQueryFilter): Promise<ReportsPreview> {
    const context = await this.buildReportsContext(filter);

    return {
      period: context.period,
      filterOptions: context.filterOptions,
      kpis: context.kpis,
      sheetCounts: context.sheetCounts,
      exportFileName: this.buildExportFileName(context.period.from, context.period.to),
    };
  }

  async getExportDataset(filter: ReportsQueryFilter): Promise<ReportsExportDataset> {
    const context = await this.buildReportsContext(filter);
    const now = new Date();

    const [actions, commitments, walkthroughs, detections] = await Promise.all([
      this.loadExportActions(context.actionWhere, now),
      this.loadExportCommitments(context.actionWhere),
      this.loadExportWalkthroughs(context.walkthroughWhere),
      this.loadExportDetections(context.detectionWhere),
    ]);

    const summary = this.buildSummaryRows(context.kpis, context.period.label);

    return {
      periodLabel: context.period.label,
      exportFileName: this.buildExportFileName(context.period.from, context.period.to),
      actions,
      commitments,
      walkthroughs,
      detections,
      summary,
    };
  }

  private async buildReportsContext(filter: ReportsQueryFilter) {
    const timeZone = this.configService.get('TIMEZONE', { infer: true });
    const period = resolveReportsPeriod({
      preset: filter.periodPreset,
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
      timeZone,
    });
    const rangeStart = parseDateOnly(period.from);
    const rangeEnd = parseDateOnly(period.to);
    rangeEnd.setUTCHours(23, 59, 59, 999);

    const dashboardFilter = {
      companyId: filter.companyId,
      areaId: filter.areaId,
      responsibleId: filter.responsibleId,
      status: filter.status,
      detectionType: filter.detectionType,
      dateFrom: period.from,
      dateTo: period.to,
    };

    const actionWhere = buildActionWhereInput(dashboardFilter, rangeStart, rangeEnd);
    const walkthroughWhere = this.buildWalkthroughWhere(dashboardFilter, rangeStart, rangeEnd);
    const detectionWhere = this.buildDetectionWhere(dashboardFilter, rangeStart, rangeEnd);

    const [
      filterOptions,
      statusGroups,
      walkthroughsCount,
      closedActionsForAvg,
      actionsCount,
      commitmentsCount,
      detectionsCount,
    ] = await Promise.all([
      this.loadFilterOptions(filter),
      this.prisma.correctiveAction.groupBy({
        by: ['status'],
        where: actionWhere,
        _count: { _all: true },
      }),
      this.prisma.walkthrough.count({ where: walkthroughWhere }),
      this.prisma.correctiveAction.findMany({
        where: { ...actionWhere, status: CorrectiveActionStatus.CLOSED },
        select: { createdAt: true, updatedAt: true },
      }),
      this.prisma.correctiveAction.count({ where: actionWhere }),
      this.prisma.correctiveCommitment.count({
        where: { correctiveAction: actionWhere },
      }),
      this.prisma.detection.count({ where: detectionWhere }),
    ]);

    const kpis = this.buildKpis(
      statusGroups,
      walkthroughsCount,
      closedActionsForAvg,
      timeZone,
    );

    const sheetCounts: ReportsSheetCounts = {
      actions: actionsCount,
      commitments: commitmentsCount,
      walkthroughs: walkthroughsCount,
      detections: detectionsCount,
    };

    return {
      period: {
        from: period.from,
        to: period.to,
        preset: period.preset,
        label: period.label,
      },
      filterOptions,
      kpis,
      sheetCounts,
      actionWhere,
      walkthroughWhere,
      detectionWhere,
    };
  }

  private buildWalkthroughWhere(
    filter: {
      companyId?: string;
      areaId?: string;
      responsibleId?: string;
    },
    rangeStart: Date,
    rangeEnd: Date,
  ): Prisma.WalkthroughWhereInput {
    const detectionScope =
      filter.companyId || filter.areaId || filter.responsibleId
        ? {
            some: {
              ...(filter.companyId ? { companyId: filter.companyId } : {}),
              ...(filter.areaId ? { areaId: filter.areaId } : {}),
              ...(filter.responsibleId
                ? { responsibleId: filter.responsibleId }
                : {}),
            },
          }
        : undefined;

    return {
      startedAt: { gte: rangeStart, lte: rangeEnd },
      ...(detectionScope ? { detections: detectionScope } : {}),
    };
  }

  private buildDetectionWhere(
    filter: {
      companyId?: string;
      areaId?: string;
      responsibleId?: string;
      detectionType?: 'unsafe_act' | 'unsafe_condition';
    },
    rangeStart: Date,
    rangeEnd: Date,
  ): Prisma.DetectionWhereInput {
    return {
      createdAt: { gte: rangeStart, lte: rangeEnd },
      ...(filter.companyId ? { companyId: filter.companyId } : {}),
      ...(filter.areaId ? { areaId: filter.areaId } : {}),
      ...(filter.responsibleId ? { responsibleId: filter.responsibleId } : {}),
      ...(filter.detectionType
        ? {
            type:
              filter.detectionType === 'unsafe_act'
                ? 'UNSAFE_ACT'
                : 'UNSAFE_CONDITION',
          }
        : {}),
    };
  }

  private async loadFilterOptions(filter?: ReportsQueryFilter) {
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
      companies: companies.map((item) => ({ value: item.id, label: item.name })),
      areas: areas.map((item) => ({ value: item.id, label: item.name })),
      responsibles: responsibles.map((item) => ({ value: item.id, label: item.name })),
    };
  }

  private buildKpis(
    statusGroups: { status: CorrectiveActionStatus; _count: { _all: number } }[],
    walkthroughsCount: number,
    closedActions: { createdAt: Date; updatedAt: Date }[],
    timeZone: string,
  ): ReportsKpis {
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

    const avgClosureDays =
      closedActions.length === 0
        ? 0
        : Math.round(
            (closedActions.reduce(
              (sum, action) =>
                sum +
                countBusinessDaysBetween(
                  action.createdAt,
                  action.updatedAt,
                  timeZone,
                ),
              0,
            ) /
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
    };
  }

  private buildExportFileName(dateFrom: string, dateTo: string): string {
    return `SIRA_Reportes_${dateFrom}_${dateTo}.xlsx`;
  }

  private buildSummaryRows(kpis: ReportsKpis, periodLabel: string) {
    return [
      { metric: 'Periodo', value: periodLabel },
      { metric: 'Acciones creadas', value: String(kpis.totalActions) },
      { metric: 'Acciones abiertas', value: String(kpis.openActions) },
      { metric: 'Acciones cerradas', value: String(kpis.closedActions) },
      { metric: 'Pendientes de aceptación', value: String(kpis.pendingAcceptance) },
      { metric: 'Expiradas', value: String(kpis.expiredActions) },
      { metric: 'En revisión de cierre', value: String(kpis.closureReview) },
      { metric: 'Cierres rechazados', value: String(kpis.rejectedClosures) },
      { metric: 'Recorridos en periodo', value: String(kpis.walkthroughsPeriod) },
      {
        metric: 'Promedio días de cierre',
        value: String(kpis.avgClosureDays),
      },
    ];
  }

  private async loadExportActions(
    actionWhere: Prisma.CorrectiveActionWhereInput,
    now: Date,
  ) {
    const actions = await this.prisma.correctiveAction.findMany({
      where: actionWhere,
      orderBy: [{ detection: { walkthrough: { startedAt: 'desc' } } }, { createdAt: 'desc' }],
      select: {
        status: true,
        correctivePlan: true,
        currentCommitmentDate: true,
        updatedAt: true,
        correctiveCommitments: {
          orderBy: { sequenceNumber: 'asc' },
          select: {
            sequenceNumber: true,
            commitmentDate: true,
            signedAt: true,
            changeReason: true,
            resolutionPhotoBlobId: true,
            resolutionPhotoBlob: { select: { createdAt: true } },
          },
        },
        detection: {
          select: {
            folio: true,
            description: true,
            createdAt: true,
            evidencePhotoBlobId: true,
            company: { select: { name: true } },
            branch: { select: { name: true } },
            area: { select: { name: true } },
            responsible: { select: { name: true } },
            walkthrough: {
              select: {
                folio: true,
                startedAt: true,
                inspector: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    return actions.map((action) => {
      const mappedStatus = mapCorrectiveActionStatusFromPrisma(action.status);
      const commitments = action.correctiveCommitments;
      const initialCommitment = commitments.find((item) => item.sequenceNumber === 0) ?? commitments[0];
      const latestCommitment =
        commitments.reduce<(typeof commitments)[number] | null>(
          (latest, current) =>
            !latest || current.sequenceNumber > latest.sequenceNumber
              ? current
              : latest,
          null,
        ) ?? null;
      const dateChangeReasons = commitments
        .filter((item) => item.sequenceNumber > 0 && item.changeReason?.trim())
        .map((item) => `F${item.sequenceNumber}: ${item.changeReason?.trim()}`)
        .join(' | ');
      const rejectionReason = resolveClosureRejectionReasonFromHistory(
        mappedStatus,
        commitments,
      );
      const resolutionMinutes =
        latestCommitment?.resolutionPhotoBlob && latestCommitment
          ? calculateResolutionDurationMinutes(
              latestCommitment.signedAt,
              latestCommitment.resolutionPhotoBlob.createdAt,
            )
          : null;

      return {
        walkthroughFolio: action.detection.walkthrough.folio,
        detectionFolio: action.detection.folio,
        companyName: action.detection.company.name,
        branchName: action.detection.branch.name,
        areaName: action.detection.area.name,
        inspectorName: action.detection.walkthrough.inspector.name,
        responsibleName: action.detection.responsible.name,
        tourDate: formatTourDateLabel(action.detection.walkthrough.startedAt) ?? '—',
        detectedAt: formatTourDateTimeLabel(action.detection.createdAt),
        initialCommitmentDate:
          formatCommitmentDateLabel(initialCommitment?.commitmentDate) ?? '—',
        currentCommitmentDate:
          formatCommitmentDateLabel(action.currentCommitmentDate) ?? '—',
        statusLabel: resolveCorrectiveStatusLabel(action.status),
        deadlineLegend: resolveDeadlineLegend(
          action.status,
          action.currentCommitmentDate,
          now,
        ),
        description: action.detection.description,
        correctivePlan: action.correctivePlan?.trim() ?? '—',
        hasInitialEvidence: Boolean(action.detection.evidencePhotoBlobId),
        hasSignedAcknowledgment: commitments.length > 0,
        hasDateReschedule: commitments.some((item) => item.sequenceNumber > 0),
        hasResolutionPhoto: Boolean(latestCommitment?.resolutionPhotoBlobId),
        isClosureApproved: action.status === CorrectiveActionStatus.CLOSED,
        hasClosureRejection: Boolean(rejectionReason),
        closureRejectionReason: rejectionReason ?? '—',
        dateChangeReasons: dateChangeReasons || '—',
        signedAt: latestCommitment
          ? formatTourDateTimeLabel(latestCommitment.signedAt)
          : '—',
        resolutionAt: latestCommitment?.resolutionPhotoBlob
          ? formatTourDateTimeLabel(latestCommitment.resolutionPhotoBlob.createdAt)
          : '—',
        resolutionMinutes:
          resolutionMinutes !== null ? String(resolutionMinutes) : '—',
        closedOnTime: resolveClosedOnTimeLabel(
          action.status,
          action.currentCommitmentDate,
          action.status === CorrectiveActionStatus.CLOSED ? action.updatedAt : null,
        ),
      };
    });
  }

  private async loadExportCommitments(actionWhere: Prisma.CorrectiveActionWhereInput) {
    const commitments = await this.prisma.correctiveCommitment.findMany({
      where: { correctiveAction: actionWhere },
      orderBy: [
        { correctiveAction: { detection: { folio: 'asc' } } },
        { sequenceNumber: 'asc' },
      ],
      select: {
        sequenceNumber: true,
        commitmentDate: true,
        signedAt: true,
        changeReason: true,
        resolutionPhotoBlobId: true,
        signedBy: { select: { name: true } },
        correctiveAction: {
          select: {
            currentCommitmentDate: true,
            correctiveCommitments: { select: { sequenceNumber: true } },
            detection: { select: { folio: true } },
          },
        },
      },
    });

    const latestSequenceByAction = new Map<string, number>();
    for (const commitment of commitments) {
      const actionId = commitment.correctiveAction.detection.folio;
      const currentMax = latestSequenceByAction.get(actionId) ?? -1;
      if (commitment.sequenceNumber > currentMax) {
        latestSequenceByAction.set(actionId, commitment.sequenceNumber);
      }
    }

    return commitments.map((commitment) => {
      const folio = commitment.correctiveAction.detection.folio;
      const latestSequence = latestSequenceByAction.get(folio) ?? commitment.sequenceNumber;
      const sequenceLabel =
        commitment.sequenceNumber === 0
          ? 'F0'
          : `F${commitment.sequenceNumber}`;

      return {
        detectionFolio: folio,
        sequenceLabel,
        commitmentDate:
          formatCommitmentDateLabel(commitment.commitmentDate) ?? '—',
        signedAt: formatTourDateTimeLabel(commitment.signedAt),
        signedByName: commitment.signedBy.name,
        changeReason: commitment.changeReason?.trim() ?? '—',
        hasResolutionPhoto: Boolean(commitment.resolutionPhotoBlobId),
        isCurrent: commitment.sequenceNumber === latestSequence,
      };
    });
  }

  private async loadExportWalkthroughs(walkthroughWhere: Prisma.WalkthroughWhereInput) {
    const walkthroughs = await this.prisma.walkthrough.findMany({
      where: walkthroughWhere,
      orderBy: { startedAt: 'desc' },
      select: {
        folio: true,
        startedAt: true,
        status: true,
        inspector: { select: { name: true } },
        detections: {
          select: {
            correctiveAction: { select: { id: true } },
          },
        },
      },
    });

    return walkthroughs.map((walkthrough) => {
      const detectionsCount = walkthrough.detections.length;
      const actionsCount = walkthrough.detections.filter(
        (detection) => detection.correctiveAction !== null,
      ).length;

      return {
        folio: walkthrough.folio,
        tourDate: formatTourDateLabel(walkthrough.startedAt) ?? '—',
        inspectorName: walkthrough.inspector.name,
        isCompleted: walkthrough.status === Status.COMPLETED,
        detectionsCount,
        actionsCount,
      };
    });
  }

  private async loadExportDetections(detectionWhere: Prisma.DetectionWhereInput) {
    const detections = await this.prisma.detection.findMany({
      where: detectionWhere,
      orderBy: { createdAt: 'desc' },
      select: {
        folio: true,
        description: true,
        type: true,
        evidencePhotoBlobId: true,
        company: { select: { name: true } },
        area: { select: { name: true } },
        responsible: { select: { name: true } },
        correctiveAction: { select: { id: true } },
        walkthrough: { select: { folio: true } },
      },
    });

    return detections.map((detection) => ({
      walkthroughFolio: detection.walkthrough.folio,
      detectionFolio: detection.folio,
      companyName: detection.company.name,
      areaName: detection.area.name,
      detectionTypeLabel: resolveDetectionTypeLabel(detection.type),
      responsibleName: detection.responsible.name,
      description: detection.description,
      hasInitialEvidence: Boolean(detection.evidencePhotoBlobId),
      hasCorrectiveAction: Boolean(detection.correctiveAction),
    }));
  }
}
