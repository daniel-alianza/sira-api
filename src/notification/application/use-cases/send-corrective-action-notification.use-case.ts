import { Inject, Injectable } from '@nestjs/common';
import type { CorrectiveActionNotificationInput } from '../interfaces/corrective-action-notification.interface';
import {
  NOTIFICATION_PORT,
  type NotificationPort,
} from '../interfaces/notification.port';

@Injectable()
export class SendCorrectiveActionNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_PORT)
    private readonly notificationPort: NotificationPort,
  ) {}

  async execute(input: CorrectiveActionNotificationInput): Promise<void> {
    await this.notificationPort.sendCorrectiveActionReminder(input);
  }
}
