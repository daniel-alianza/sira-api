import type { CorrectiveActionStatus } from './corrective.interface';

export type CorrectiveClosureDecision = 'approve' | 'reject';

export interface ReviewCorrectiveClosureInput {
  readonly actionId: string;
  readonly reviewerUserId: string;
  readonly decision: CorrectiveClosureDecision;
  readonly reviewNotes?: string;
}

export interface ReviewCorrectiveClosureResult {
  readonly id: string;
  readonly status: CorrectiveActionStatus;
  readonly decision: CorrectiveClosureDecision;
}
