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
import type {
  CorrectiveActionForRespond,
  RespondCorrectiveActionResult,
} from '../interfaces/respond-corrective-action.interface';
import type { CorrectiveActionStatus as ApiCorrectiveActionStatus } from '../interfaces/corrective.interface';

const MAX_COMMITMENT_SEQUENCE = 3;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const FIRST_RESPONSE_STATUS: ApiCorrectiveActionStatus = 'pending_acceptance';

const DATE_UPDATE_ALLOWED_STATUSES: readonly ApiCorrectiveActionStatus[] = [
  'open',
  'pending',
  'expired',
  'reopened',
];

export interface RespondCorrectiveActionCommand {
  readonly actionId: string;
  readonly userId: string;
  readonly correctivePlan: string;
  readonly commitmentDate: string;
  readonly signatureDataUrl: string;
  readonly resolutionPhotoDataUrl?: string;
  readonly changeReason?: string;
}

@Injectable()
export class RespondCorrectiveActionUseCase {
  constructor(
    @Inject(CORRECTIVE_ACTION_REPOSITORY)
    private readonly correctiveActionRepository: CorrectiveActionRepositoryPort,
  ) {}

  async execute(
    command: RespondCorrectiveActionCommand,
  ): Promise<RespondCorrectiveActionResult> {
    const action = await this.correctiveActionRepository.findForRespond(
      command.actionId,
    );

    if (!action) {
      throw new NotFoundException('Acción correctiva no encontrada');
    }

    if (action.responsibleId !== command.userId) {
      throw new ForbiddenException(
        'Solo el responsable asignado puede responder esta acción',
      );
    }

    const isFirstResponse = action.status === FIRST_RESPONSE_STATUS;

    this.validateStatusForRespond(action, isFirstResponse, command.changeReason);
    this.resolveNextSequence(action, isFirstResponse);

    const commitmentDate = this.parseCommitmentDate(command.commitmentDate);
    this.validateCommitmentDate(commitmentDate);

    const result = await this.correctiveActionRepository.respondToAction({
      actionId: action.id,
      userId: command.userId,
      correctivePlan: command.correctivePlan.trim(),
      commitmentDate: command.commitmentDate,
      signatureDataUrl: command.signatureDataUrl,
      resolutionPhotoDataUrl: command.resolutionPhotoDataUrl,
      changeReason: command.changeReason?.trim(),
    });

    return result;
  }

  private validateStatusForRespond(
    action: CorrectiveActionForRespond,
    isFirstResponse: boolean,
    changeReason: string | undefined,
  ): void {
    if (isFirstResponse) {
      return;
    }

    if (!DATE_UPDATE_ALLOWED_STATUSES.includes(action.status)) {
      throw new BadRequestException(
        'Esta acción no permite actualizar la fecha compromiso en su estado actual',
      );
    }

    if (!changeReason?.trim()) {
      throw new BadRequestException(
        'Indica el motivo del cambio de fecha compromiso',
      );
    }
  }

  private resolveNextSequence(
    action: CorrectiveActionForRespond,
    isFirstResponse: boolean,
  ): number {
    if (isFirstResponse) {
      return 0;
    }

    const currentSequence = action.latestSequenceNumber;

    if (currentSequence === null) {
      throw new BadRequestException(
        'No hay un compromiso previo para actualizar',
      );
    }

    const nextSequence = currentSequence + 1;

    if (nextSequence > MAX_COMMITMENT_SEQUENCE) {
      throw new BadRequestException(
        'Se alcanzó el máximo de reprogramaciones (F3)',
      );
    }

    return nextSequence;
  }

  private parseCommitmentDate(commitmentDate: string): Date {
    if (!DATE_ONLY_PATTERN.test(commitmentDate)) {
      throw new BadRequestException(
        'La fecha compromiso debe tener formato YYYY-MM-DD',
      );
    }

    const [year, month, day] = commitmentDate.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      throw new BadRequestException('La fecha compromiso no es válida');
    }

    return parsedDate;
  }

  private validateCommitmentDate(commitmentDate: Date): void {
    const today = new Date();
    const todayUtc = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
    );

    if (commitmentDate < todayUtc) {
      throw new BadRequestException(
        'La fecha compromiso debe ser hoy o una fecha futura',
      );
    }
  }
}
