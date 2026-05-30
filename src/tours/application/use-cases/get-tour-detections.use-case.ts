import {
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  ROLE_ADMINISTRATOR,
  ROLE_INSPECTOR,
} from '../../../auth/application/constants/role-names';
import {
  ROLE_REPOSITORY,
  type RoleRepositoryPort,
} from '../../../auth/application/interfaces/role.port';
import type {
  TourCorrectiveActionRow,
  TourPeriod,
} from '../interfaces/tours.interface';
import {
  TOURS_REPOSITORY,
  type ToursRepositoryPort,
} from '../interfaces/tours.port';

@Injectable()
export class GetTourDetectionsUseCase {
  constructor(
    @Inject(TOURS_REPOSITORY)
    private readonly toursRepository: ToursRepositoryPort,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async execute(
    roleId: string,
    period: TourPeriod,
  ): Promise<TourCorrectiveActionRow[]> {
    const roleName = await this.roleRepository.findNameById(roleId);

    if (!roleName) {
      throw new ForbiddenException('Rol no válido');
    }

    if (
      roleName === ROLE_ADMINISTRATOR ||
      roleName === ROLE_INSPECTOR
    ) {
      return this.toursRepository.findDetectionsByPeriod(period);
    }

    throw new ForbiddenException(
      'No tienes permisos para consultar recorridos',
    );
  }
}
