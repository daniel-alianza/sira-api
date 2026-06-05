import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { buildApiResponse } from '../../common/helpers/build-api-response';
import { ROLE_ADMINISTRATOR, ROLE_INSPECTOR } from '../../auth/application/constants/role-names';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import type { UpdateUserInput, UserFilter } from '../application/interfaces/user.interface';
import { GetAllUsersUseCase } from '../application/use-cases/get-all-users.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { updateUserBodySchema } from './dtos/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  @Get()
  @Roles(ROLE_ADMINISTRATOR, ROLE_INSPECTOR)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('areaId') areaId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const filter: UserFilter = {};
    if (companyId) filter.companyId = companyId;
    if (areaId) filter.areaId = areaId;
    if (branchId) filter.branchId = branchId;

    const hasFilters = Object.keys(filter).length > 0;
    const users = await this.getAllUsersUseCase.execute(hasFilters ? filter : undefined);

    return buildApiResponse(users, 'Usuarios obtenidos correctamente');
  }

  @Patch(':id')
  @Roles(ROLE_ADMINISTRATOR)
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() body: unknown) {
    const parsedBody = updateUserBodySchema.safeParse(body);

    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'body';
      throw new BadRequestException(`${field}: ${firstIssue?.message}`);
    }

    const payload: UpdateUserInput = {
      ...(parsedBody.data.name !== undefined && { name: parsedBody.data.name }),
      ...(parsedBody.data.email !== undefined && {
        email: parsedBody.data.email,
      }),
      ...(parsedBody.data.password !== undefined && {
        password: parsedBody.data.password,
      }),
      ...(parsedBody.data.empresaId !== undefined && {
        companyId: parsedBody.data.empresaId,
      }),
      ...(parsedBody.data.sucursalId !== undefined && {
        branchId: parsedBody.data.sucursalId,
      }),
      ...(parsedBody.data.areaId !== undefined && {
        areaId: parsedBody.data.areaId,
      }),
      ...(parsedBody.data.roleId !== undefined && {
        roleId: parsedBody.data.roleId,
      }),
      ...(parsedBody.data.isActive !== undefined && {
        isActive: parsedBody.data.isActive,
      }),
    };

    const user = await this.updateUserUseCase.execute(id, payload);

    return buildApiResponse(user, 'Usuario actualizado correctamente');
  }
}
