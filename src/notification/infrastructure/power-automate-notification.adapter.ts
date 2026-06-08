import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { EnvVariables } from '../../config/env-validation';
import type { CorrectiveActionNotificationPayload } from '../application/interfaces/corrective-action-notification.interface';
import type { NotificationPort } from '../application/interfaces/notification.port';

@Injectable()
export class PowerAutomateNotificationAdapter implements NotificationPort {
  private readonly logger = new Logger(PowerAutomateNotificationAdapter.name);

  constructor(
    private readonly configService: ConfigService<EnvVariables, true>,
  ) {}

  async sendCorrectiveActionReminder(
    input: CorrectiveActionNotificationPayload,
  ): Promise<void> {
    const webhookUrl = this.configService
      .get('TEAMS_WEBHOOK_URL', { infer: true })
      .trim();

    this.logger.log(
      JSON.stringify({
        event: 'corrective_action_notification',
        recipientEmail: input.recipientEmail,
        detectionFolio: input.detectionFolio,
        status: input.status,
        actionUrl: input.actionUrl,
      }),
    );

    if (!webhookUrl) {
      this.logger.warn(
        'TEAMS_WEBHOOK_URL no configurada; se omitió el envío de notificación',
      );
      return;
    }

    try {
      const response = await axios.post<unknown>(
        webhookUrl,
        {
          recipientEmail: input.recipientEmail,
          responsibleName: input.responsibleName,
          detectionFolio: input.detectionFolio,
          actionUrl: input.actionUrl,
          status: input.status,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true,
        },
      );

      if (response.status < 200 || response.status >= 300) {
        throw new InternalServerErrorException(
          `No se pudo entregar la notificación: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'No se pudo entregar la notificación. Intenta de nuevo.',
        { cause: error },
      );
    }
  }
}
