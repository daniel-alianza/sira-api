import type {
  CorrectiveActionDetailRow,
  CorrectiveActionRow,
  FindCorrectiveActionsFilter,
} from './corrective.interface';
import type {
  CorrectiveActionForRespond,
  RespondCorrectiveActionInput,
  RespondCorrectiveActionResult,
} from './respond-corrective-action.interface';
import type {
  ReviewCorrectiveClosureInput,
  ReviewCorrectiveClosureResult,
} from './review-corrective-closure.interface';
import type {
  SubmitDetectionEvidenceInput,
  SubmitDetectionEvidenceResult,
  CorrectiveActionForDetectionEvidence,
} from './submit-detection-evidence.interface';
import type {
  SubmitResolutionPhotoInput,
  SubmitResolutionPhotoResult,
} from './submit-resolution-photo.interface';

export interface CorrectiveActionForClosureReview {
  readonly id: string;
  readonly status: import('./corrective.interface').CorrectiveActionStatus;
  readonly hasResolutionEvidence: boolean;
}

export interface CorrectiveActionRepositoryPort {
  findRoleNameById(roleId: string): Promise<string | null>;
  findAll(filter: FindCorrectiveActionsFilter): Promise<CorrectiveActionRow[]>;
  findById(actionId: string): Promise<CorrectiveActionDetailRow | null>;
  findForRespond(actionId: string): Promise<CorrectiveActionForRespond | null>;
  respondToAction(
    input: RespondCorrectiveActionInput,
  ): Promise<RespondCorrectiveActionResult>;
  submitResolutionPhoto(
    input: SubmitResolutionPhotoInput,
  ): Promise<SubmitResolutionPhotoResult>;
  findForDetectionEvidence(
    actionId: string,
  ): Promise<CorrectiveActionForDetectionEvidence | null>;
  submitDetectionEvidence(
    input: SubmitDetectionEvidenceInput,
  ): Promise<SubmitDetectionEvidenceResult>;
  findForClosureReview(
    actionId: string,
  ): Promise<CorrectiveActionForClosureReview | null>;
  reviewClosure(
    input: ReviewCorrectiveClosureInput,
  ): Promise<ReviewCorrectiveClosureResult>;
  reassignResponsible(
    actionId: string,
    newResponsibleId: string,
  ): Promise<void>;
  findClosed(
    filter: FindCorrectiveActionsFilter,
  ): Promise<import('./corrective.interface').ClosedActionSummaryRow[]>;
}

export const CORRECTIVE_ACTION_REPOSITORY = Symbol(
  'CORRECTIVE_ACTION_REPOSITORY',
);
