import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ROLE_ADMINISTRATOR,
  ROLE_INSPECTOR,
} from '../../../auth/application/constants/role-names';
import {
  CORRECTIVE_ACTION_REPOSITORY,
  type CorrectiveActionRepositoryPort,
} from '../interfaces/corrective.port';
import type {
  CorrectiveClosureDecision,
  ReviewCorrectiveClosureResult,
} from '../interfaces/review-corrective-closure.interface';

const CLOSURE_REVIEW_STATUS = 'closure_review';

export interface ReviewCorrectiveClosureCommand {
  readonly actionId: string;
  readonly reviewerUserId: string;
  readonly reviewerRoleId: string;
  readonly decision: CorrectiveClosureDecision;
  readonly reviewNotes?: string;
}

@Injectable()
export class ReviewCorrectiveClosureUseCase {
  constructor(
    @Inject(CORRECTIVE_ACTION_REPOSITORY)
    private readonly correctiveActionRepository: CorrectiveActionRepositoryPort,
  ) {}

  async execute(
    command: ReviewCorrectiveClosureCommand,
  ): Promise<ReviewCorrectiveClosureResult> {
    const roleName = await this.correctiveActionRepository.findRoleNameById(
      command.reviewerRoleId,
    );

    if (!roleName) {
      throw new ForbiddenException('Rol no válido');
    }

    this.assertReviewerRole(roleName);

    const action = await this.correctiveActionRepository.findForClosureReview(
      command.actionId,
    );

    if (!action) {
      throw new NotFoundException('Acción correctiva no encontrada');
    }

    if (action.status !== CLOSURE_REVIEW_STATUS) {
      throw new BadRequestException(
        'Solo se puede revisar el cierre cuando la acción está en revisión de cierre',
      );
    }

    if (!action.hasResolutionEvidence) {
      throw new BadRequestException(
        'La acción no tiene evidencia de resolución para revisar',
      );
    }

    if (command.decision === 'reject' && !command.reviewNotes?.trim()) {
      throw new BadRequestException(
        'Indica el motivo del rechazo para que el responsable pueda corregir',
      );
    }

    return this.correctiveActionRepository.reviewClosure({
      actionId: command.actionId,
      reviewerUserId: command.reviewerUserId,
      decision: command.decision,
      reviewNotes: command.reviewNotes?.trim(),
    });
  }

  private assertReviewerRole(roleName: string): void {
    if (roleName !== ROLE_ADMINISTRATOR && roleName !== ROLE_INSPECTOR) {
      throw new ForbiddenException(
        'Solo un inspector o administrador puede revisar el cierre',
      );
    }
  }
}
