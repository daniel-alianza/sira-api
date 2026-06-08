import { ForbiddenException } from '@nestjs/common';
import {
  ROLE_ADMINISTRATOR,
  ROLE_INSPECTOR,
} from '../../../auth/application/constants/role-names';
import type { UpdateUserInput } from '../interfaces/user.interface';

export function assertUserUpdatePermissions(
  requesterRoleName: string | null,
  _targetRoleName: string | null,
  _input: UpdateUserInput,
): void {
  if (
    requesterRoleName === ROLE_ADMINISTRATOR ||
    requesterRoleName === ROLE_INSPECTOR
  ) {
    return;
  }

  throw new ForbiddenException('No tienes permiso para actualizar usuarios');
}

export function stripInspectorRestrictedFields(
  _requesterRoleName: string | null,
  input: UpdateUserInput,
): UpdateUserInput {
  return input;
}
