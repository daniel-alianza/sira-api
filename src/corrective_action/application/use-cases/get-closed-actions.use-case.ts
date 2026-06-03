import { Inject, Injectable } from '@nestjs/common';
import type {
  ClosedActionSummaryRow,
  FindCorrectiveActionsFilter,
} from '../interfaces/corrective.interface';
import {
  CORRECTIVE_ACTION_REPOSITORY,
  type CorrectiveActionRepositoryPort,
} from '../interfaces/corrective.port';

@Injectable()
export class GetClosedActionsUseCase {
  constructor(
    @Inject(CORRECTIVE_ACTION_REPOSITORY)
    private readonly correctiveActionRepository: CorrectiveActionRepositoryPort,
  ) {}

  async execute(
    filter: FindCorrectiveActionsFilter,
  ): Promise<ClosedActionSummaryRow[]> {
    return this.correctiveActionRepository.findClosed({
      ...filter,
      status: 'closed',
    });
  }
}
