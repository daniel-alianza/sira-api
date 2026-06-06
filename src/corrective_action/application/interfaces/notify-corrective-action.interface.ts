import type { CorrectiveActionStatus } from './corrective.interface';

export interface CorrectiveActionForNotify {
  readonly id: string;
  readonly status: CorrectiveActionStatus;
  readonly detectionFolio: string;
  readonly responsibleId: string;
  readonly responsibleName: string;
  readonly responsibleEmail: string;
}

export interface NotifyCorrectiveActionResult {
  readonly actionId: string;
  readonly responsibleEmail: string;
}

export interface NotifyCorrectiveActionsBulkResult {
  readonly notifiedCount: number;
  readonly skippedCount: number;
}
