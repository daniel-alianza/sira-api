import type { CorrectiveActionNotificationInput } from './corrective-action-notification.interface';

export const NOTIFICATION_PORT = Symbol('NOTIFICATION_PORT');

export interface NotificationPort {
  sendCorrectiveActionReminder(
    input: CorrectiveActionNotificationInput,
  ): Promise<void>;
}
