import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertCanManageDetectionEvidence } from '../helpers/corrective-access.helper';
import type { SubmitDetectionEvidenceResult } from '../interfaces/submit-detection-evidence.interface';
import {
  CORRECTIVE_ACTION_REPOSITORY,
  type CorrectiveActionRepositoryPort,
} from '../interfaces/corrective.port';

export interface SubmitDetectionEvidenceCommand {
  readonly actionId: string;
  readonly userId: string;
  readonly roleId: string;
  readonly evidencePhotoDataUrl: string;
}

@Injectable()
export class SubmitDetectionEvidenceUseCase {
  constructor(
    @Inject(CORRECTIVE_ACTION_REPOSITORY)
    private readonly correctiveActionRepository: CorrectiveActionRepositoryPort,
  ) {}

  async execute(
    command: SubmitDetectionEvidenceCommand,
  ): Promise<SubmitDetectionEvidenceResult> {
    const roleName = await this.correctiveActionRepository.findRoleNameById(
      command.roleId,
    );

    assertCanManageDetectionEvidence(roleName);

    const action =
      await this.correctiveActionRepository.findForDetectionEvidence(
        command.actionId,
      );

    if (!action) {
      throw new NotFoundException('Acción correctiva no encontrada');
    }

    return this.correctiveActionRepository.submitDetectionEvidence({
      actionId: command.actionId,
      userId: command.userId,
      evidencePhotoDataUrl: command.evidencePhotoDataUrl,
    });
  }
}
