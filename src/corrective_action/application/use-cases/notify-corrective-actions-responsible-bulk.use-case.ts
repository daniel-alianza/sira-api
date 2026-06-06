import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ROLE_ADMINISTRATOR,
  ROLE_INSPECTOR,
} from '../../../auth/application/constants/role-names';
import {
  buildCorrectiveActionNotificationContent,
  sendCorrectiveActionNotification,
} from '../helpers/send-corrective-action-notification.helper';
import type { NotifyCorrectiveActionsBulkResult } from '../interfaces/notify-corrective-action.interface';
import {
  CORRECTIVE_ACTION_REPOSITORY,
  type CorrectiveActionRepositoryPort,
} from '../interfaces/corrective.port';

const NOTIFY_ALLOWED_STATUSES = new Set(['pending_acceptance', 'open']);

@Injectable()
export class NotifyCorrectiveActionsResponsibleBulkUseCase {
  constructor(
    @Inject(CORRECTIVE_ACTION_REPOSITORY)
    private readonly correctiveActionRepository: CorrectiveActionRepositoryPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    actionIds: readonly string[],
    requesterRoleId: string,
  ): Promise<NotifyCorrectiveActionsBulkResult> {
    const roleName =
      await this.correctiveActionRepository.findRoleNameById(requesterRoleId);

    if (roleName !== ROLE_ADMINISTRATOR && roleName !== ROLE_INSPECTOR) {
      throw new ForbiddenException(
        'Solo inspectores y administradores pueden notificar responsables',
      );
    }

    if (actionIds.length === 0) {
      throw new BadRequestException('Debes indicar al menos una acción');
    }

    const uniqueActionIds = [...new Set(actionIds)];
    const actions =
      await this.correctiveActionRepository.findManyForNotify(uniqueActionIds);
    const actionsById = new Map(actions.map((action) => [action.id, action]));
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? '';

    let notifiedCount = 0;
    let skippedCount = 0;

    for (const actionId of uniqueActionIds) {
      const action = actionsById.get(actionId);

      if (!action || !NOTIFY_ALLOWED_STATUSES.has(action.status)) {
        skippedCount += 1;
        continue;
      }

      const actionUrl = `${frontendUrl.replace(/\/$/, '')}/actions/${action.id}`;
      const notificationContent = buildCorrectiveActionNotificationContent({
        responsibleName: action.responsibleName,
        detectionFolio: action.detectionFolio,
        actionUrl,
        status: action.status,
      });

      await sendCorrectiveActionNotification({
        recipientEmail: action.responsibleEmail,
        subject: notificationContent.subject,
        body: notificationContent.body,
        actionUrl,
      });

      notifiedCount += 1;
    }

    if (notifiedCount === 0) {
      throw new BadRequestException(
        'No se pudo notificar ninguna acción válida',
      );
    }

    return {
      notifiedCount,
      skippedCount,
    };
  }
}
