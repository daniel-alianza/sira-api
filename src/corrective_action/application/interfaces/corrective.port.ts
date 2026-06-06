import type {
  CorrectiveActionDetailRow,
  CorrectiveActionRow,
  FindCorrectiveActionsFilter,
} from './corrective.interface';
import type {
  CorrectiveActionForDirectClose,
  DirectCloseCorrectiveActionInput,
  DirectCloseCorrectiveActionResult,
} from './direct-close-corrective-action.interface';
import type { CorrectiveActionForNotify } from './notify-corrective-action.interface';
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
  findForNotify(actionId: string): Promise<CorrectiveActionForNotify | null>;
  findManyForNotify(
    actionIds: readonly string[],
  ): Promise<readonly CorrectiveActionForNotify[]>;
  findUserAreaNameById(userId: string): Promise<string | null>;
  findForDirectClose(actionId: string): Promise<CorrectiveActionForDirectClose | null>;
  directCloseAction(
    input: DirectCloseCorrectiveActionInput,
  ): Promise<DirectCloseCorrectiveActionResult>;
}

export const CORRECTIVE_ACTION_REPOSITORY = Symbol(
  'CORRECTIVE_ACTION_REPOSITORY',
);
