import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PasswordRegisterUseCase } from '../../../auth/application/use-cases/password-register.use-case';
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

  async execute(id: string, input: UpdateUserInput): Promise<UserPublic> {
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (input.email && input.email !== existingUser.email) {
      const emailTaken = await this.userRepository.findByEmail(input.email);

      if (emailTaken) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
    }

    if (input.companyId || input.areaId || input.branchId) {
      await this.userRepository.validateOrganizationIds(
        input.companyId ?? existingUser.companyId,
        input.areaId ?? existingUser.areaId,
        input.branchId ?? existingUser.branchId,
      );
    }

    if (input.roleId) {
      const role = await this.userRepository.findRoleById(input.roleId);

      if (!role) {
        throw new NotFoundException('Rol no encontrado');
      }
    }

    const { password, ...updateData } = input;

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
