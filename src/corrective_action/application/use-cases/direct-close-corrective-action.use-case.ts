import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SHE_AREA_NAME } from '../constants/she-area.constants';
import type { DirectCloseCorrectiveActionResult } from '../interfaces/direct-close-corrective-action.interface';
import {
  CORRECTIVE_ACTION_REPOSITORY,
  type CorrectiveActionRepositoryPort,
} from '../interfaces/corrective.port';

const CLOSED_STATUS = 'closed';

export interface DirectCloseCorrectiveActionCommand {
  readonly actionId: string;
  readonly userId: string;
  readonly reason: string;
}

@Injectable()
export class DirectCloseCorrectiveActionUseCase {
  constructor(
    @Inject(CORRECTIVE_ACTION_REPOSITORY)
    private readonly correctiveActionRepository: CorrectiveActionRepositoryPort,
  ) {}

  async execute(
    command: DirectCloseCorrectiveActionCommand,
  ): Promise<DirectCloseCorrectiveActionResult> {
    const requesterAreaName =
      await this.correctiveActionRepository.findUserAreaNameById(command.userId);

    if (requesterAreaName !== SHE_AREA_NAME) {
      throw new ForbiddenException(
        'Solo el área de Seguridad e Higiene puede cerrar acciones de manera directa',
      );
    }

    const trimmedReason = command.reason.trim();

    if (trimmedReason.length < 10) {
      throw new BadRequestException(
        'Indica el motivo del cierre directo (mínimo 10 caracteres)',
      );
    }

    const action = await this.correctiveActionRepository.findForDirectClose(
      command.actionId,
    );

    if (!action) {
      throw new NotFoundException('Acción correctiva no encontrada');
    }

    if (action.status === CLOSED_STATUS) {
      throw new BadRequestException('La acción correctiva ya está cerrada');
    }

    return this.correctiveActionRepository.directCloseAction({
      actionId: action.id,
      closedByUserId: command.userId,
      reason: trimmedReason,
    });
  }
}
