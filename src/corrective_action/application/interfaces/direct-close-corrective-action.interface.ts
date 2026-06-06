import type { CorrectiveActionStatus } from './corrective.interface';

export interface CorrectiveActionForDirectClose {
  readonly id: string;
  readonly status: CorrectiveActionStatus;
  readonly correctivePlan: string | null;
  readonly latestCommitmentId: string | null;
}

export interface DirectCloseCorrectiveActionInput {
  readonly actionId: string;
  readonly closedByUserId: string;
  readonly reason: string;
}

export interface DirectCloseCorrectiveActionResult {
  readonly id: string;
  readonly status: CorrectiveActionStatus;
}
