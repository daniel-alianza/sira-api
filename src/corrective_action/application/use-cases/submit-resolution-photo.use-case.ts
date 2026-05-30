import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CORRECTIVE_ACTION_REPOSITORY,
  type CorrectiveActionRepositoryPort,
} from '../interfaces/corrective.port';
import type { SubmitResolutionPhotoResult } from '../interfaces/submit-resolution-photo.interface';

const RESOLUTION_ALLOWED_STATUSES = [
  'open',
  'pending',
  'expired',
  'reopened',
] as const;

export interface SubmitResolutionPhotoCommand {
  readonly actionId: string;
  readonly userId: string;
  readonly resolutionPhotoDataUrl: string;
}

@Injectable()
export class SubmitResolutionPhotoUseCase {
  constructor(
    @Inject(CORRECTIVE_ACTION_REPOSITORY)
    private readonly correctiveActionRepository: CorrectiveActionRepositoryPort,
  ) {}

  async execute(
    command: SubmitResolutionPhotoCommand,
  ): Promise<SubmitResolutionPhotoResult> {
    const action = await this.correctiveActionRepository.findForRespond(
      command.actionId,
    );

    if (!action) {
      throw new NotFoundException('Acción correctiva no encontrada');
    }

    if (action.responsibleId !== command.userId) {
      throw new ForbiddenException(
        'Solo el responsable asignado puede subir la evidencia de resolución',
      );
    }

    if (!action.latestCommitmentId) {
      throw new BadRequestException(
        'Debes firmar el compromiso antes de subir la evidencia de resolución',
      );
    }

    if (
      !RESOLUTION_ALLOWED_STATUSES.includes(
        action.status as (typeof RESOLUTION_ALLOWED_STATUSES)[number],
      )
    ) {
      throw new BadRequestException(
        'Esta acción no permite subir evidencia de resolución en su estado actual',
      );
    }

    if (action.latestCommitmentHasResolution) {
      throw new BadRequestException(
        'La evidencia de resolución ya fue registrada para este compromiso',
      );
    }

    return this.correctiveActionRepository.submitResolutionPhoto({
      actionId: command.actionId,
      userId: command.userId,
      resolutionPhotoDataUrl: command.resolutionPhotoDataUrl,
    });
  }
}
