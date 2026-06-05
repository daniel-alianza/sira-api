import { Injectable } from '@nestjs/common';
import {
  CorrectiveActionStatus as PrismaCorrectiveActionStatus,
  MediaBlobKind,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { buildMediaResourcePath } from '../../media/application/helpers/build-media-resource-path.helper';
import { createMediaBlobInTransaction } from '../../media/application/helpers/create-media-blob-in-transaction.helper';
import {
  mapCorrectiveActionStatusFromPrisma,
  mapDetectionTypeFromPrisma,
} from '../../tours/application/mappers/tours-enum.mapper';
import {
  formatCommitmentDateLabel,
  formatTourDateLabel,
  formatTourDateTimeLabel,
} from '../../tours/application/helpers/tour-date.helper';
import type {
  ClosedActionSummaryRow,
  CorrectiveActionDetailRow,
  CorrectiveActionRow,
  FindCorrectiveActionsFilter,
} from '../application/interfaces/corrective.interface';
import {
  mapCommitmentHistory,
  resolveClosureRejectionReasonFromHistory,
} from '../application/helpers/map-commitment-history.helper';
import { calculateResolutionDurationMinutes } from '../application/helpers/resolution-duration.helper';
import type {
  CorrectiveActionForDetectionEvidence,
  SubmitDetectionEvidenceInput,
  SubmitDetectionEvidenceResult,
} from '../application/interfaces/submit-detection-evidence.interface';
import type {
  CorrectiveActionForRespond,
  RespondCorrectiveActionInput,
  RespondCorrectiveActionResult,
} from '../application/interfaces/respond-corrective-action.interface';
import type {
  CorrectiveActionForClosureReview,
} from '../application/interfaces/corrective.port';
import type {
  ReviewCorrectiveClosureInput,
  ReviewCorrectiveClosureResult,
} from '../application/interfaces/review-corrective-closure.interface';
import type {
  SubmitResolutionPhotoInput,
  SubmitResolutionPhotoResult,
} from '../application/interfaces/submit-resolution-photo.interface';
import type { CorrectiveActionRepositoryPort } from '../application/interfaces/corrective.port';

@Injectable()
export class PrismaCorrectiveActionRepository implements CorrectiveActionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findRoleNameById(roleId: string): Promise<string | null> {
    return this.prisma.role
      .findUnique({
        where: { id: roleId },
        select: { name: true },
      })
      .then((role) => role?.name ?? null);
  }

  async findAll(
    filter: FindCorrectiveActionsFilter,
  ): Promise<CorrectiveActionRow[]> {
    const actions = await this.prisma.correctiveAction.findMany({
      where: buildActionFindWhere(filter),
      orderBy: [
        { detection: { walkthrough: { startedAt: 'desc' } } },
        { detection: { createdAt: 'desc' } },
      ],
      select: correctiveActionSelect,
    });

    return actions.map((action) => mapCorrectiveActionRow(action));
  }

  async findById(actionId: string): Promise<CorrectiveActionDetailRow | null> {
    const action = await this.prisma.correctiveAction.findUnique({
      where: { id: actionId },
      select: correctiveActionDetailSelect,
    });

    if (!action) {
      return null;
    }

    return mapCorrectiveActionDetailRow(action as CorrectiveActionDetailSelected);
  }

  async findForRespond(
    actionId: string,
  ): Promise<CorrectiveActionForRespond | null> {
    const action = await this.prisma.correctiveAction.findUnique({
      where: { id: actionId },
      select: {
        id: true,
        status: true,
        detection: {
          select: { responsibleId: true },
        },
        correctiveCommitments: {
          orderBy: { sequenceNumber: 'desc' },
          take: 1,
          select: {
            id: true,
            sequenceNumber: true,
            resolutionPhotoBlobId: true,
          },
        },
      },
    });

    if (!action) {
      return null;
    }

    const latestCommitment = action.correctiveCommitments[0] ?? null;

    return {
      id: action.id,
      status: mapCorrectiveActionStatusFromPrisma(action.status),
      responsibleId: action.detection.responsibleId,
      latestCommitmentId: latestCommitment?.id ?? null,
      latestSequenceNumber: latestCommitment?.sequenceNumber ?? null,
      latestCommitmentHasResolution: Boolean(
        latestCommitment?.resolutionPhotoBlobId,
      ),
    };
  }

  async submitResolutionPhoto(
    input: SubmitResolutionPhotoInput,
  ): Promise<SubmitResolutionPhotoResult> {
    const result = await this.prisma.$transaction(async (transaction) => {
      const action = await transaction.correctiveAction.findUnique({
        where: { id: input.actionId },
        select: {
          id: true,
          status: true,
          correctiveCommitments: {
            orderBy: { sequenceNumber: 'desc' },
            take: 1,
            select: {
              id: true,
              signedAt: true,
              resolutionPhotoBlobId: true,
            },
          },
        },
      });

      if (!action) {
        throw new Error('CORRECTIVE_ACTION_NOT_FOUND');
      }

      const latestCommitment = action.correctiveCommitments[0] ?? null;

      if (!latestCommitment) {
        throw new Error('CORRECTIVE_COMMITMENT_NOT_FOUND');
      }

      if (latestCommitment.resolutionPhotoBlobId) {
        throw new Error('CORRECTIVE_RESOLUTION_ALREADY_SUBMITTED');
      }

      const resolutionPhotoBlobId = await createMediaBlobInTransaction(
        transaction,
        {
          kind: MediaBlobKind.CORRECTIVE_RESOLUTION,
          dataUrl: input.resolutionPhotoDataUrl,
          uploadedById: input.userId,
        },
      );

      const resolutionBlob = await transaction.mediaBlob.findUnique({
        where: { id: resolutionPhotoBlobId },
        select: { createdAt: true },
      });

      if (!resolutionBlob) {
        throw new Error('CORRECTIVE_RESOLUTION_BLOB_NOT_FOUND');
      }

      await transaction.correctiveCommitment.update({
        where: { id: latestCommitment.id },
        data: { resolutionPhotoBlobId },
      });

      const updatedAction = await transaction.correctiveAction.update({
        where: { id: action.id },
        data: { status: PrismaCorrectiveActionStatus.CLOSURE_REVIEW },
        select: { id: true, status: true },
      });

      const resolutionDurationMinutes = calculateResolutionDurationMinutes(
        latestCommitment.signedAt,
        resolutionBlob.createdAt,
      );

      return {
        id: updatedAction.id,
        status: mapCorrectiveActionStatusFromPrisma(updatedAction.status),
        resolutionPhotoBlobId,
        resolutionResolvedAt: formatTourDateTimeLabel(resolutionBlob.createdAt),
        resolutionDurationMinutes,
      };
    });

    return result;
  }

  async findForDetectionEvidence(
    actionId: string,
  ): Promise<CorrectiveActionForDetectionEvidence | null> {
    const action = await this.prisma.correctiveAction.findUnique({
      where: { id: actionId },
      select: {
        id: true,
        detectionId: true,
        detection: {
          select: { evidencePhotoBlobId: true },
        },
      },
    });

    if (!action) {
      return null;
    }

    return {
      id: action.id,
      detectionId: action.detectionId,
      hasDetectionEvidence: Boolean(action.detection.evidencePhotoBlobId),
    };
  }

  async submitDetectionEvidence(
    input: SubmitDetectionEvidenceInput,
  ): Promise<SubmitDetectionEvidenceResult> {
    const evidencePhotoBlobId = await this.prisma.$transaction(
      async (transaction) => {
        const action = await transaction.correctiveAction.findUnique({
          where: { id: input.actionId },
          select: { detectionId: true },
        });

        if (!action) {
          throw new Error('CORRECTIVE_ACTION_NOT_FOUND');
        }

        const blobId = await createMediaBlobInTransaction(transaction, {
          kind: MediaBlobKind.DETECTION_EVIDENCE,
          dataUrl: input.evidencePhotoDataUrl,
          uploadedById: input.userId,
        });

        await transaction.detection.update({
          where: { id: action.detectionId },
          data: { evidencePhotoBlobId: blobId },
        });

        return blobId;
      },
    );

    const evidencePhotoUrl = buildMediaResourcePath(evidencePhotoBlobId);

    if (!evidencePhotoUrl) {
      throw new Error('DETECTION_EVIDENCE_BLOB_NOT_FOUND');
    }

    return {
      evidencePhotoUrl,
    };
  }

  async respondToAction(
    input: RespondCorrectiveActionInput,
  ): Promise<RespondCorrectiveActionResult> {
    const commitmentDate = parseCommitmentDateOnly(input.commitmentDate);

    const result = await this.prisma.$transaction(async (transaction) => {
      const action = await transaction.correctiveAction.findUnique({
        where: { id: input.actionId },
        select: {
          id: true,
          status: true,
          correctiveCommitments: {
            orderBy: { sequenceNumber: 'desc' },
            take: 1,
            select: {
              id: true,
              sequenceNumber: true,
            },
          },
        },
      });

      if (!action) {
        throw new Error('CORRECTIVE_ACTION_NOT_FOUND');
      }

      const latestCommitment = action.correctiveCommitments[0] ?? null;
      const isFirstResponse =
        action.status === PrismaCorrectiveActionStatus.PENDING_ACCEPTANCE;
      const nextSequence = isFirstResponse
        ? 0
        : (latestCommitment?.sequenceNumber ?? -1) + 1;

      const signatureBlobId = await createMediaBlobInTransaction(transaction, {
        kind: MediaBlobKind.CORRECTIVE_SIGNATURE,
        dataUrl: input.signatureDataUrl,
        uploadedById: input.userId,
      });

      let resolutionPhotoBlobId: string | undefined;
      if (input.resolutionPhotoDataUrl) {
        resolutionPhotoBlobId = await createMediaBlobInTransaction(transaction, {
          kind: MediaBlobKind.CORRECTIVE_RESOLUTION,
          dataUrl: input.resolutionPhotoDataUrl,
          uploadedById: input.userId,
        });
      }

      const commitment = await transaction.correctiveCommitment.create({
        data: {
          correctiveActionId: action.id,
          sequenceNumber: nextSequence,
          commitmentDate,
          signatureBlobId,
          resolutionPhotoBlobId,
          signedById: input.userId,
          changeReason: input.changeReason ?? null,
          previousCommitmentId: latestCommitment?.id ?? null,
        },
        select: { sequenceNumber: true },
      });

      const updatedAction = await transaction.correctiveAction.update({
        where: { id: action.id },
        data: {
          correctivePlan: input.correctivePlan,
          currentCommitmentDate: commitmentDate,
          status: isFirstResponse
            ? PrismaCorrectiveActionStatus.OPEN
            : action.status,
        },
        select: { id: true, status: true },
      });

      return {
        id: updatedAction.id,
        status: mapCorrectiveActionStatusFromPrisma(updatedAction.status),
        commitmentSequence: commitment.sequenceNumber,
        ...(resolutionPhotoBlobId
          ? { resolutionPhotoBlobId }
          : {}),
      };
    });

    return result;
  }

  async findForClosureReview(
    actionId: string,
  ): Promise<CorrectiveActionForClosureReview | null> {
    const action = await this.prisma.correctiveAction.findUnique({
      where: { id: actionId },
      select: {
        id: true,
        status: true,
        correctiveCommitments: {
          orderBy: { sequenceNumber: 'desc' },
          take: 1,
          select: {
            resolutionPhotoBlobId: true,
          },
        },
      },
    });

    if (!action) {
      return null;
    }

    const latestCommitment = action.correctiveCommitments[0] ?? null;

    return {
      id: action.id,
      status: mapCorrectiveActionStatusFromPrisma(action.status),
      hasResolutionEvidence: Boolean(latestCommitment?.resolutionPhotoBlobId),
    };
  }

  async reassignResponsible(
    actionId: string,
    newResponsibleId: string,
  ): Promise<void> {
    const action = await this.prisma.correctiveAction.findUnique({
      where: { id: actionId },
      select: { detectionId: true },
    });

    if (!action) {
      throw new Error('CORRECTIVE_ACTION_NOT_FOUND');
    }

    await this.prisma.detection.update({
      where: { id: action.detectionId },
      data: { responsibleId: newResponsibleId },
    });
  }

  async reviewClosure(
    input: ReviewCorrectiveClosureInput,
  ): Promise<ReviewCorrectiveClosureResult> {
    const result = await this.prisma.$transaction(async (transaction) => {
      const action = await transaction.correctiveAction.findUnique({
        where: { id: input.actionId },
        select: {
          id: true,
          status: true,
          correctiveCommitments: {
            orderBy: { sequenceNumber: 'desc' },
            take: 1,
            select: {
              id: true,
              resolutionPhotoBlobId: true,
            },
          },
        },
      });

      if (!action) {
        throw new Error('CORRECTIVE_ACTION_NOT_FOUND');
      }

      if (action.status !== PrismaCorrectiveActionStatus.CLOSURE_REVIEW) {
        throw new Error('CORRECTIVE_ACTION_INVALID_STATUS');
      }

      const latestCommitment = action.correctiveCommitments[0] ?? null;

      if (!latestCommitment?.resolutionPhotoBlobId) {
        throw new Error('CORRECTIVE_RESOLUTION_MISSING');
      }

      if (input.decision === 'reject') {
        await transaction.correctiveCommitment.update({
          where: { id: latestCommitment.id },
          data: {
            resolutionPhotoBlobId: null,
            changeReason: input.reviewNotes ?? null,
          },
        });
      }

      const nextStatus =
        input.decision === 'approve'
          ? PrismaCorrectiveActionStatus.CLOSED
          : PrismaCorrectiveActionStatus.REOPENED;

      const updatedAction = await transaction.correctiveAction.update({
        where: { id: action.id },
        data: { status: nextStatus },
        select: { id: true, status: true },
      });

      return {
        id: updatedAction.id,
        status: mapCorrectiveActionStatusFromPrisma(updatedAction.status),
        decision: input.decision,
      };
    });

    return result;
  }

  async findClosed(
    filter: FindCorrectiveActionsFilter,
  ): Promise<ClosedActionSummaryRow[]> {
    const actions = await this.prisma.correctiveAction.findMany({
      where: {
        ...buildActionFindWhere(filter),
        status: PrismaCorrectiveActionStatus.CLOSED,
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        updatedAt: true,
        detection: {
          select: {
            folio: true,
            description: true,
            type: true,
            evidencePhotoBlobId: true,
            company: { select: { name: true } },
            branch: { select: { name: true } },
            area: { select: { name: true } },
            responsible: { select: { name: true } },
            walkthrough: { select: { folio: true } },
          },
        },
        correctiveCommitments: {
          orderBy: { sequenceNumber: 'desc' },
          take: 1,
          select: { resolutionPhotoBlobId: true },
        },
      },
    });

    return actions.map((action) => {
      const detection = action.detection;
      const latestCommitment = action.correctiveCommitments[0] ?? null;

      return {
        id: action.id,
        detectionFolio: detection.folio,
        walkthroughFolio: detection.walkthrough.folio,
        detectionType: mapDetectionTypeFromPrisma(detection.type),
        description: detection.description,
        responsibleName: detection.responsible.name,
        companyName: detection.company.name,
        branchName: detection.branch.name,
        areaName: detection.area.name,
        closedAt: formatTourDateLabel(action.updatedAt),
        evidencePhotoUrl: buildMediaResourcePath(detection.evidencePhotoBlobId),
        resolutionPhotoUrl: buildMediaResourcePath(
          latestCommitment?.resolutionPhotoBlobId,
        ),
      };
    });
  }
}

function buildActionFindWhere(
  filter: FindCorrectiveActionsFilter,
): import('../../../generated/prisma/client').Prisma.CorrectiveActionWhereInput {
  const where: import('../../../generated/prisma/client').Prisma.CorrectiveActionWhereInput = {};

  const detectionFilter: import('../../../generated/prisma/client').Prisma.DetectionWhereInput = {};

  if (filter.responsibleId) {
    detectionFilter.responsibleId = filter.responsibleId;
  }

  if (filter.companyId) {
    detectionFilter.companyId = filter.companyId;
  }

  if (filter.areaId) {
    detectionFilter.areaId = filter.areaId;
  }

  if (filter.branchId) {
    detectionFilter.branchId = filter.branchId;
  }

  if (Object.keys(detectionFilter).length > 0) {
    where.detection = detectionFilter;
  }

  if (filter.status) {
    where.status = filter.status as PrismaCorrectiveActionStatus;
  }

  if (filter.dateFrom || filter.dateTo) {
    const createdAtFilter: { gte?: Date; lte?: Date } = {};

    if (filter.dateFrom) {
      createdAtFilter.gte = parseCommitmentDateOnly(filter.dateFrom);
    }

    if (filter.dateTo) {
      const endDate = parseCommitmentDateOnly(filter.dateTo);
      endDate.setUTCHours(23, 59, 59, 999);
      createdAtFilter.lte = endDate;
    }

    where.createdAt = createdAtFilter;
  }

  return where;
}

function parseCommitmentDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

const commitmentSelectFields = {
  sequenceNumber: true,
  signedAt: true,
  commitmentDate: true,
  changeReason: true,
  signatureBlobId: true,
  resolutionPhotoBlobId: true,
  resolutionPhotoBlob: {
    select: { createdAt: true },
  },
} as const;

const correctiveActionSelect = {
  id: true,
  correctivePlan: true,
  status: true,
  currentCommitmentDate: true,
  correctiveCommitments: {
    orderBy: { sequenceNumber: 'desc' as const },
    take: 1,
    select: commitmentSelectFields,
  },
  detection: {
    select: {
      folio: true,
      type: true,
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
} as const;

const correctiveActionDetailSelect = {
  id: true,
  correctivePlan: true,
  status: true,
  currentCommitmentDate: true,
  correctiveCommitments: {
    orderBy: { sequenceNumber: 'asc' as const },
    select: commitmentSelectFields,
  },
  detection: correctiveActionSelect.detection,
} as const;

type CorrectiveActionSelected = {
  id: string;
  correctivePlan: string | null;
  status: PrismaCorrectiveActionStatus;
  currentCommitmentDate: Date | null;
  correctiveCommitments: {
    sequenceNumber: number;
    signedAt: Date;
    commitmentDate: Date;
    changeReason: string | null;
    signatureBlobId: string;
    resolutionPhotoBlobId: string | null;
    resolutionPhotoBlob: { createdAt: Date } | null;
  }[];
  detection: {
    folio: string;
    type: import('../../../generated/prisma/client').DetectionType;
    description: string;
    createdAt: Date;
    evidencePhotoBlobId: string | null;
    company: { name: string };
    branch: { name: string };
    area: { name: string };
    responsible: { name: string };
    walkthrough: {
      folio: string;
      startedAt: Date;
      inspector: { name: string };
    };
  };
};

type CorrectiveActionDetailSelected = Omit<
  CorrectiveActionSelected,
  'correctiveCommitments'
> & {
  correctiveCommitments: CorrectiveActionSelected['correctiveCommitments'];
};

function getLatestCommitment(
  commitments: CorrectiveActionSelected['correctiveCommitments'],
): CorrectiveActionSelected['correctiveCommitments'][number] | null {
  if (commitments.length === 0) {
    return null;
  }

  return commitments.reduce((latest, current) =>
    current.sequenceNumber > latest.sequenceNumber ? current : latest,
  );
}

function mapCorrectiveActionRow(action: CorrectiveActionSelected): CorrectiveActionRow {
  const latestCommitment = getLatestCommitment(action.correctiveCommitments);
  const tourStartedAt = action.detection.walkthrough.startedAt;

  return {
    id: action.id,
    detectionFolio: action.detection.folio,
    walkthroughFolio: action.detection.walkthrough.folio,
    detectionType: mapDetectionTypeFromPrisma(action.detection.type),
    description: action.detection.description,
    companyName: action.detection.company.name,
    branchName: action.detection.branch.name,
    areaName: action.detection.area.name,
    status: mapCorrectiveActionStatusFromPrisma(action.status),
    correctivePlan: action.correctivePlan,
    currentCommitmentDate: formatCommitmentDateLabel(action.currentCommitmentDate),
    commitmentSequence: latestCommitment?.sequenceNumber ?? null,
    assignedAt: formatTourDateLabel(action.detection.createdAt),
    tourDate: formatTourDateLabel(tourStartedAt),
    evidencePhotoUrl: buildMediaResourcePath(action.detection.evidencePhotoBlobId),
    resolutionPhotoUrl: buildMediaResourcePath(latestCommitment?.resolutionPhotoBlobId),
  };
}

function mapCorrectiveActionDetailRow(
  action: CorrectiveActionDetailSelected,
): CorrectiveActionDetailRow {
  const mappedStatus = mapCorrectiveActionStatusFromPrisma(action.status);
  const baseRow = mapCorrectiveActionRow(action);
  const latestCommitment = getLatestCommitment(action.correctiveCommitments);
  const commitmentHistory = mapCommitmentHistory(
    mappedStatus,
    action.correctiveCommitments,
  );

  return {
    ...baseRow,
    inspectorName: action.detection.walkthrough.inspector.name,
    inspectedAt: formatTourDateTimeLabel(action.detection.createdAt),
    responsibleName: action.detection.responsible.name,
    photoUrl: buildMediaResourcePath(action.detection.evidencePhotoBlobId),
    photoCaption: `Evidencia del recorrido · ${action.detection.area.name}`,
    signatureUrl: buildMediaResourcePath(latestCommitment?.signatureBlobId),
    resolutionPhotoUrl: buildMediaResourcePath(
      latestCommitment?.resolutionPhotoBlobId,
    ),
    respondedAt: latestCommitment
      ? formatTourDateTimeLabel(latestCommitment.signedAt)
      : null,
    resolutionResolvedAt: latestCommitment?.resolutionPhotoBlob
      ? formatTourDateTimeLabel(latestCommitment.resolutionPhotoBlob.createdAt)
      : null,
    resolutionDurationMinutes: latestCommitment?.resolutionPhotoBlob
      ? calculateResolutionDurationMinutes(
          latestCommitment.signedAt,
          latestCommitment.resolutionPhotoBlob.createdAt,
        )
      : null,
    closureRejectionReason: resolveClosureRejectionReasonFromHistory(
      mappedStatus,
      action.correctiveCommitments,
    ),
    commitmentHistory,
  };
}
