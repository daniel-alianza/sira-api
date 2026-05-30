import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MediaBlobKind, Status } from '../../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { createMediaBlobInTransaction } from '../../media/application/helpers/create-media-blob-in-transaction.helper';
import {
  formatCommitmentDateLabel,
  formatTourDateLabel,
  resolvePeriodStartDate,
  resolveWeekdayLabel,
  resolveWeekdayOrder,
} from '../application/helpers/tour-date.helper';
import type {
  RegisterWalkthroughInput,
  RegisterWalkthroughResult,
  TourCorrectiveActionRow,
  TourPeriod,
} from '../application/interfaces/tours.interface';
import type { ToursRepositoryPort } from '../application/interfaces/tours.port';
import {
  mapCorrectiveActionStatusFromPrisma,
  mapDetectionTypeFromPrisma,
  mapDetectionTypeToPrisma,
} from '../application/mappers/tours-enum.mapper';

@Injectable()
export class PrismaRegisterToursRepository implements ToursRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async registerWalkthrough(
    input: RegisterWalkthroughInput,
  ): Promise<RegisterWalkthroughResult> {
    const existingWalkthrough = await this.prisma.walkthrough.findUnique({
      where: { folio: input.folio },
      select: { id: true },
    });

    if (existingWalkthrough) {
      throw new ConflictException('El folio del recorrido ya está registrado');
    }

    if (input.detections.length > 0) {
      await this.validateDetectionsPayload(input.detections);
    }

    const finishedAt = new Date();

    const walkthrough = await this.prisma.$transaction(async (transaction) => {
      const createdWalkthrough = await transaction.walkthrough.create({
        data: {
          folio: input.folio,
          inspectorId: input.inspectorId,
          startedAt: input.startedAt,
          finishedAt,
          status: Status.COMPLETED,
        },
        select: {
          id: true,
          folio: true,
        },
      });

      for (const detection of input.detections) {
        let evidencePhotoBlobId: string | undefined;

        if (detection.evidencePhotoDataUrl) {
          evidencePhotoBlobId = await createMediaBlobInTransaction(transaction, {
            kind: MediaBlobKind.DETECTION_EVIDENCE,
            dataUrl: detection.evidencePhotoDataUrl,
            uploadedById: input.inspectorId,
          });
        }

        const createdDetection = await transaction.detection.create({
          data: {
            folio: detection.folio,
            walkthroughId: createdWalkthrough.id,
            companyId: detection.companyId,
            branchId: detection.branchId,
            areaId: detection.areaId,
            type: mapDetectionTypeToPrisma(detection.detectionType),
            description: detection.description,
            responsibleId: detection.responsibleId,
            evidencePhotoBlobId,
          },
          select: { id: true },
        });

        await transaction.correctiveAction.create({
          data: {
            detectionId: createdDetection.id,
          },
        });
      }

      return createdWalkthrough;
    });

    return {
      id: walkthrough.id,
      folio: walkthrough.folio,
      status: 'completed',
      detectionsCount: input.detections.length,
      finishedAt: finishedAt.toISOString(),
    };
  }

  async findDetectionsByInspectorAndPeriod(
    inspectorId: string,
    period: TourPeriod,
  ): Promise<TourCorrectiveActionRow[]> {
    return this.findDetections(period, inspectorId);
  }

  async findDetectionsByPeriod(
    period: TourPeriod,
  ): Promise<TourCorrectiveActionRow[]> {
    return this.findDetections(period);
  }

  private async findDetections(
    period: TourPeriod,
    inspectorId?: string,
  ): Promise<TourCorrectiveActionRow[]> {
    const periodStart = resolvePeriodStartDate(period, new Date());

    const detections = await this.prisma.detection.findMany({
      where: {
        walkthrough: {
          ...(inspectorId !== undefined && { inspectorId }),
          startedAt: {
            gte: periodStart,
          },
        },
      },
      orderBy: [{ walkthrough: { startedAt: 'desc' } }, { createdAt: 'desc' }],
      select: {
        folio: true,
        type: true,
        createdAt: true,
        area: {
          select: { name: true },
        },
        responsible: {
          select: { name: true },
        },
        walkthrough: {
          select: {
            folio: true,
            startedAt: true,
          },
        },
        correctiveAction: {
          select: {
            id: true,
            status: true,
            currentCommitmentDate: true,
          },
        },
      },
    });

    return detections
      .filter((detection) => detection.correctiveAction !== null)
      .map((detection) => {
        const correctiveAction = detection.correctiveAction!;
        const tourStartedAt = detection.walkthrough.startedAt;

        return {
          id: correctiveAction.id,
          walkthroughFolio: detection.walkthrough.folio,
          detectionFolio: detection.folio,
          detectionType: mapDetectionTypeFromPrisma(detection.type),
          status: mapCorrectiveActionStatusFromPrisma(correctiveAction.status),
          responsible: detection.responsible.name,
          area: detection.area.name,
          tourDate: formatTourDateLabel(tourStartedAt),
          weekdayLabel: resolveWeekdayLabel(tourStartedAt),
          weekdayOrder: resolveWeekdayOrder(tourStartedAt),
          commitmentDate: formatCommitmentDateLabel(
            correctiveAction.currentCommitmentDate,
          ),
        };
      });
  }

  private async validateDetectionsPayload(
    detections: RegisterWalkthroughInput['detections'],
  ): Promise<void> {
    const companyIds = [...new Set(detections.map((item) => item.companyId))];
    const areaIds = [...new Set(detections.map((item) => item.areaId))];
    const branchIds = [...new Set(detections.map((item) => item.branchId))];
    const responsibleIds = [
      ...new Set(detections.map((item) => item.responsibleId)),
    ];
    const detectionFolios = detections.map((item) => item.folio);

    const [companies, areas, branches, responsibles, existingDetectionFolios] =
      await Promise.all([
        this.prisma.company.findMany({
          where: { id: { in: companyIds } },
          select: { id: true },
        }),
        this.prisma.area.findMany({
          where: { id: { in: areaIds } },
          select: { id: true },
        }),
        this.prisma.branch.findMany({
          where: { id: { in: branchIds } },
          select: { id: true },
        }),
        this.prisma.user.findMany({
          where: { id: { in: responsibleIds }, isActive: true },
          select: { id: true },
        }),
        this.prisma.detection.findMany({
          where: { folio: { in: detectionFolios } },
          select: { folio: true },
        }),
      ]);

    if (companies.length !== companyIds.length) {
      throw new NotFoundException('Una o más empresas no existen');
    }

    if (areas.length !== areaIds.length) {
      throw new NotFoundException('Una o más áreas no existen');
    }

    if (branches.length !== branchIds.length) {
      throw new NotFoundException('Una o más sucursales no existen');
    }

    if (responsibles.length !== responsibleIds.length) {
      throw new NotFoundException(
        'Uno o más responsables no existen o están inactivos',
      );
    }

    if (existingDetectionFolios.length > 0) {
      throw new ConflictException(
        'Uno o más folios de detección ya están registrados',
      );
    }
  }
}
