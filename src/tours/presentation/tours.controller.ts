import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { buildApiResponse } from '../../common/helpers/build-api-response';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import {
  ROLE_ADMINISTRATOR,
  ROLE_INSPECTOR,
} from '../../auth/application/constants/role-names';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import type { JwtPayload } from '../../auth/application/interfaces/jwt.auth.port';
import type { RegisterWalkthroughInput } from '../application/interfaces/tours.interface';
import { GetTourDetectionsUseCase } from '../application/use-cases/get-tour-detections.use-case';
import { ToursToRegisterUseCase } from '../application/use-cases/tours-to-register.use-case';
import {
  registerWalkthroughBodySchema,
  tourDetectionsQuerySchema,
} from './dtos';

@Controller('tours')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE_ADMINISTRATOR, ROLE_INSPECTOR)
export class ToursController {
  constructor(
    private readonly toursToRegisterUseCase: ToursToRegisterUseCase,
    private readonly getTourDetectionsUseCase: GetTourDetectionsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: unknown,
  ) {
    const parsedBody = registerWalkthroughBodySchema.safeParse(body);

    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'body';
      throw new BadRequestException(`${field}: ${firstIssue?.message}`);
    }

    const payload: RegisterWalkthroughInput = {
      inspectorId: currentUser.sub,
      folio: parsedBody.data.folio,
      startedAt: new Date(parsedBody.data.startedAt),
      detections: parsedBody.data.detections,
    };

    const walkthrough = await this.toursToRegisterUseCase.execute(payload);

    return buildApiResponse(walkthrough, 'Recorrido registrado correctamente');
  }

  @Get('detections')
  @HttpCode(HttpStatus.OK)
  async getDetections(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: unknown,
  ) {
    const parsedQuery = tourDetectionsQuerySchema.safeParse(query);

    if (!parsedQuery.success) {
      const firstIssue = parsedQuery.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'query';
      throw new BadRequestException(`${field}: ${firstIssue?.message}`);
    }

    const rows = await this.getTourDetectionsUseCase.execute(
      currentUser.roleId,
      parsedQuery.data.period,
    );

    return buildApiResponse(rows, 'Detecciones obtenidas correctamente');
  }
}
