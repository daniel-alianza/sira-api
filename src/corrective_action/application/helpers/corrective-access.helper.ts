import { ForbiddenException } from '@nestjs/common';
import {
  ROLE_ADMINISTRATOR,
  ROLE_INSPECTOR,
  ROLE_RESPONSIBLE,
} from '../../../auth/application/constants/role-names';
import type { FindCorrectiveActionsFilter } from '../interfaces/corrective.interface';

export function assertCanAccessCorrectiveActions(roleName: string | null): void {
  if (!roleName) {
    throw new ForbiddenException('Rol no válido');
  }

  if (
    roleName !== ROLE_RESPONSIBLE &&
    roleName !== ROLE_ADMINISTRATOR &&
    roleName !== ROLE_INSPECTOR
  ) {
    throw new ForbiddenException('Rol no válido');
  }
}

export function resolveCorrectiveActionsFilter(
  roleName: string,
  userId: string,
): FindCorrectiveActionsFilter {
  assertCanAccessCorrectiveActions(roleName);

  if (roleName === ROLE_RESPONSIBLE) {
    return { responsibleId: userId };
  }

  return {};
}

export function isResponsibleRole(roleName: string): boolean {
  return roleName === ROLE_RESPONSIBLE;
}
