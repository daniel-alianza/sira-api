import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ROLE_ADMINISTRATOR,
  ROLE_INSPECTOR,
} from '../../../auth/application/constants/role-names';
import type { CorrectiveActionNotificationStatus } from '../../../notification/application/interfaces/corrective-action-notification.interface';
import { SendCorrectiveActionNotificationUseCase } from '../../../notification/application/use-cases/send-corrective-action-notification.use-case';
import type { NotifyCorrectiveActionResult } from '../interfaces/notify-corrective-action.interface';
import {
  CORRECTIVE_ACTION_REPOSITORY,
  type CorrectiveActionRepositoryPort,
} from '../interfaces/corrective.port';

const NOTIFY_ALLOWED_STATUSES = new Set<CorrectiveActionNotificationStatus>([
  'pending_acceptance',
  'open',
]);

@Injectable()
export class NotifyCorrectiveActionResponsibleUseCase {
  constructor(
    @Inject(CORRECTIVE_ACTION_REPOSITORY)
    private readonly correctiveActionRepository: CorrectiveActionRepositoryPort,
    private readonly configService: ConfigService,
    private readonly sendCorrectiveActionNotificationUseCase: SendCorrectiveActionNotificationUseCase,
  ) {}

  async execute(
    actionId: string,
    requesterRoleId: string,
  ): Promise<NotifyCorrectiveActionResult> {
    const roleName =
      await this.correctiveActionRepository.findRoleNameById(requesterRoleId);

    if (roleName !== ROLE_ADMINISTRATOR && roleName !== ROLE_INSPECTOR) {
      throw new ForbiddenException(
        'Solo inspectores y administradores pueden notificar responsables',
      );
    }

    const action =
      await this.correctiveActionRepository.findForNotify(actionId);

    if (!action) {
      throw new NotFoundException('Acción correctiva no encontrada');
    }

    if (!NOTIFY_ALLOWED_STATUSES.has(action.status as CorrectiveActionNotificationStatus)) {
      throw new BadRequestException(
        'Solo se pueden notificar acciones pendientes de firma o abiertas',
      );
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? '';
    const actionUrl = `${frontendUrl.replace(/\/$/, '')}/actions/${action.id}`;

    await this.sendCorrectiveActionNotificationUseCase.execute({
      recipientEmail: action.responsibleEmail,
      responsibleName: action.responsibleName,
      detectionFolio: action.detectionFolio,
      actionUrl,
      status: action.status as CorrectiveActionNotificationStatus,
    });

    return {
      actionId: action.id,
      responsibleEmail: action.responsibleEmail,
    };
  }
}
