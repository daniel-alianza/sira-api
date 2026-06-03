import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { resolveCorrectiveActionsFilter } from '../helpers/corrective-access.helper';
import type {
  CorrectiveActionRow,
  FindCorrectiveActionsFilter,
} from '../interfaces/corrective.interface';
import {
  CORRECTIVE_ACTION_REPOSITORY,
  type CorrectiveActionRepositoryPort,
} from '../interfaces/corrective.port';

@Injectable()
export class GetActionsUseCase {
  constructor(
    @Inject(CORRECTIVE_ACTION_REPOSITORY)
    private readonly correctiveActionRepository: CorrectiveActionRepositoryPort,
  ) {}

  async execute(
    userId: string,
    roleId: string,
    queryFilters?: FindCorrectiveActionsFilter,
  ): Promise<CorrectiveActionRow[]> {
    const roleName =
      await this.correctiveActionRepository.findRoleNameById(roleId);

    if (!roleName) {
      throw new ForbiddenException('Rol no válido');
    }

    const filter = resolveCorrectiveActionsFilter(roleName, userId);

    return this.correctiveActionRepository.findAll({
      ...filter,
      ...queryFilters,
    });
  }
}
