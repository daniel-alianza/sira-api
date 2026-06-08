export type CorrectiveActionNotificationStatus = 'pending_acceptance' | 'open';

export interface CorrectiveActionNotificationInput {
  readonly recipientEmail: string;
  readonly responsibleName: string;
  readonly detectionFolio: string;
  readonly actionUrl: string;
  readonly status: CorrectiveActionNotificationStatus;
}

export interface CorrectiveActionNotificationPayload {
  readonly recipientEmail: string;
  readonly responsibleName: string;
  readonly detectionFolio: string;
  readonly actionUrl: string;
  readonly status: CorrectiveActionNotificationStatus;
}
