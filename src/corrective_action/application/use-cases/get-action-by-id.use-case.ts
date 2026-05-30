import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assertCanAccessCorrectiveActions,
  isResponsibleRole,
} from '../helpers/corrective-access.helper';
import type { CorrectiveActionDetailRow } from '../interfaces/corrective.interface';
import {
  CORRECTIVE_ACTION_REPOSITORY,
  type CorrectiveActionRepositoryPort,
} from '../interfaces/corrective.port';

@Injectable()
export class GetActionByIdUseCase {
  constructor(
    @Inject(CORRECTIVE_ACTION_REPOSITORY)
    private readonly correctiveActionRepository: CorrectiveActionRepositoryPort,
  ) {}

  async execute(
    actionId: string,
    userId: string,
    roleId: string,
  ): Promise<CorrectiveActionDetailRow> {
    const roleName =
      await this.correctiveActionRepository.findRoleNameById(roleId);

    assertCanAccessCorrectiveActions(roleName);

    const action = await this.correctiveActionRepository.findById(actionId);

    if (!action) {
      throw new NotFoundException('Acción correctiva no encontrada');
    }

    if (roleName && isResponsibleRole(roleName)) {
      const actionForRespond =
        await this.correctiveActionRepository.findForRespond(actionId);

      if (!actionForRespond || actionForRespond.responsibleId !== userId) {
        throw new ForbiddenException(
          'Solo puedes consultar las acciones correctivas asignadas a ti',
        );
      }
    }

    return action;
  }
}
