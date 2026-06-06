import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PasswordRegisterUseCase } from '../../../auth/application/use-cases/password-register.use-case';
import {
  ROLE_ADMINISTRATOR,
  ROLE_INSPECTOR,
} from '../../../auth/application/constants/role-names';
import {
  assertUserUpdatePermissions,
  stripInspectorRestrictedFields,
} from '../helpers/assert-user-update-permissions.helper';
import type { UpdateUserInput, UserPublic } from '../interfaces/user.interface';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../interfaces/user.port';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordRegisterUseCase: PasswordRegisterUseCase,
  ) {}

  async execute(
    id: string,
    input: UpdateUserInput,
    requesterRoleId: string,
  ): Promise<UserPublic> {
    const requesterRole = await this.userRepository.findRoleById(requesterRoleId);

    if (!requesterRole) {
      throw new ForbiddenException('Rol no válido');
    }

    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const targetRole = await this.userRepository.findRoleById(existingUser.roleId);
    const sanitizedInput = stripInspectorRestrictedFields(
      requesterRole.name,
      input,
    );

    assertUserUpdatePermissions(
      requesterRole.name,
      targetRole?.name ?? null,
      sanitizedInput,
    );

    if (sanitizedInput.email && sanitizedInput.email !== existingUser.email) {
      const emailTaken = await this.userRepository.findByEmail(sanitizedInput.email);

      if (emailTaken) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
    }

    if (sanitizedInput.companyId || sanitizedInput.areaId || sanitizedInput.branchId) {
      await this.userRepository.validateOrganizationIds(
        sanitizedInput.companyId ?? existingUser.companyId,
        sanitizedInput.areaId ?? existingUser.areaId,
        sanitizedInput.branchId ?? existingUser.branchId,
      );
    }

    if (sanitizedInput.roleId) {
      const role = await this.userRepository.findRoleById(sanitizedInput.roleId);

      if (!role) {
        throw new NotFoundException('Rol no encontrado');
      }

      if (
        requesterRole.name !== ROLE_ADMINISTRATOR &&
        role.name !== ROLE_INSPECTOR
      ) {
        throw new ForbiddenException(
          'Solo puedes asignar el rol Inspector',
        );
      }
    }

    const { password, ...updateData } = sanitizedInput;

    const hashedPassword =
      password !== undefined
        ? await this.passwordRegisterUseCase.execute(password)
        : undefined;

    return this.userRepository.update(id, {
      ...updateData,
      hashedPassword,
    });
  }
}
