import { ForbiddenException } from '@nestjs/common';
import {
  ROLE_ADMINISTRATOR,
  ROLE_INSPECTOR,
} from '../../../auth/application/constants/role-names';
import type { UpdateUserInput } from '../interfaces/user.interface';

export function assertUserUpdatePermissions(
  requesterRoleName: string | null,
  targetRoleName: string | null,
  input: UpdateUserInput,
): void {
  if (requesterRoleName === ROLE_ADMINISTRATOR) {
    return;
  }

  if (requesterRoleName !== ROLE_INSPECTOR) {
    throw new ForbiddenException('No tienes permiso para actualizar usuarios');
  }

  if (targetRoleName !== ROLE_INSPECTOR) {
    throw new ForbiddenException(
      'Solo puedes editar la información de usuarios con rol Inspector',
    );
  }

  if (input.isActive !== undefined) {
    throw new ForbiddenException(
      'No tienes permiso para activar o desactivar usuarios',
    );
  }

  if (input.roleId !== undefined) {
    throw new ForbiddenException('No tienes permiso para cambiar el rol del usuario');
  }
}

export function stripInspectorRestrictedFields(
  requesterRoleName: string | null,
  input: UpdateUserInput,
): UpdateUserInput {
  if (requesterRoleName === ROLE_ADMINISTRATOR) {
    return input;
  }

  if (requesterRoleName !== ROLE_INSPECTOR) {
    return input;
  }

  const { isActive: _isActive, roleId: _roleId, ...allowedInput } = input;
  return allowedInput;
}
