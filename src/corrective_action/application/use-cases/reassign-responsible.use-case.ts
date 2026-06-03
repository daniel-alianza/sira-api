import {
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

export interface ReassignResponsibleCommand {
  readonly actionId: string;
  readonly newResponsibleId: string;
  readonly requesterRoleId: string;
}

@Injectable()
export class ReassignResponsibleUseCase {
  constructor(
    @Inject(CORRECTIVE_ACTION_REPOSITORY)
    private readonly correctiveActionRepository: CorrectiveActionRepositoryPort,
  ) {}

  async execute(command: ReassignResponsibleCommand): Promise<void> {
    const roleName = await this.correctiveActionRepository.findRoleNameById(
      command.requesterRoleId,
    );

    if (!roleName) {
      throw new ForbiddenException('Rol no válido');
    }

    if (roleName !== ROLE_ADMINISTRATOR && roleName !== ROLE_INSPECTOR) {
      throw new ForbiddenException(
        'Solo administradores e inspectores pueden reasignar responsables',
      );
    }

    const action = await this.correctiveActionRepository.findById(
      command.actionId,
    );

    if (!action) {
      throw new NotFoundException('Acción correctiva no encontrada');
    }

    await this.correctiveActionRepository.reassignResponsible(
      command.actionId,
      command.newResponsibleId,
    );
  }
}
