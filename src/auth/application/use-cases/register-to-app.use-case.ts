import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { RegisterInterface } from '../interfaces/register.interface';
import { PasswordRegisterUseCase } from './password-register.use-case';
import {
  REGISTER_USER_REPOSITORY,
  type RegisterUserRepositoryPort,
} from '../interfaces/register-user.port';

const DEFAULT_ROLE_NAME = 'Responsable';

@Injectable()
export class RegisterToAppUseCase {
  constructor(
    @Inject(REGISTER_USER_REPOSITORY)
    private readonly registerUserRepository: RegisterUserRepositoryPort,
    private readonly passwordRegisterUseCase: PasswordRegisterUseCase,
  ) {}

  async execute(input: RegisterInterface): Promise<RegisterInterface> {
    if (!input.password) {
      throw new BadRequestException('La contraseña es requerida');
    }

    const existingUser = await this.registerUserRepository.findByEmail(
      input.email,
    );

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    await this.registerUserRepository.validateOrganizationIds(
      input.companyId,
      input.areaId,
      input.branchId,
    );

    const roleId = await this.resolveRoleId(input.roleId);
    const hashedPassword = await this.passwordRegisterUseCase.execute(
      input.password,
    );

    return this.registerUserRepository.create({
      ...input,
      roleId,
      hashedPassword,
    });
  }

  private async resolveRoleId(roleId?: string): Promise<string> {
    if (roleId) {
      return roleId;
    }

    const defaultRole =
      await this.registerUserRepository.findRoleByName(DEFAULT_ROLE_NAME);

    if (!defaultRole) {
      throw new NotFoundException('Rol por defecto no configurado');
    }

    return defaultRole.id;
  }
}
