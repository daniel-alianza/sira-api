import { Module } from '@nestjs/common';
import { NOTIFICATION_PORT } from './application/interfaces/notification.port';
import { SendCorrectiveActionNotificationUseCase } from './application/use-cases/send-corrective-action-notification.use-case';
import { PowerAutomateNotificationAdapter } from './infrastructure/power-automate-notification.adapter';

@Module({
  providers: [
    SendCorrectiveActionNotificationUseCase,
    {
      provide: NOTIFICATION_PORT,
      useClass: PowerAutomateNotificationAdapter,
    },
  ],
  exports: [SendCorrectiveActionNotificationUseCase],
})
export class NotificationModule {}
