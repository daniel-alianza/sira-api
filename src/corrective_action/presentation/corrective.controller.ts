import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Body,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { buildApiResponse } from '../../common/helpers/build-api-response';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import type { JwtPayload } from '../../auth/application/interfaces/jwt.auth.port';
import { GetActionsUseCase } from '../application/use-cases/get-actions.use-case';
import { GetActionByIdUseCase } from '../application/use-cases/get-action-by-id.use-case';
import { RespondCorrectiveActionUseCase } from '../application/use-cases/respond-corrective-action.use-case';
import { ReviewCorrectiveClosureUseCase } from '../application/use-cases/review-corrective-closure.use-case';
import { SubmitResolutionPhotoUseCase } from '../application/use-cases/submit-resolution-photo.use-case';
import { ReassignResponsibleUseCase } from '../application/use-cases/reassign-responsible.use-case';
import { GetClosedActionsUseCase } from '../application/use-cases/get-closed-actions.use-case';
import {
  respondCorrectiveActionBodySchema,
  reviewCorrectiveClosureBodySchema,
  submitResolutionPhotoBodySchema,
  reassignResponsibleBodySchema,
  actionsQuerySchema,
} from './dtos';

@Controller('corrective-actions')
@UseGuards(JwtAuthGuard)
export class CorrectiveController {
  constructor(
    private readonly getActionsUseCase: GetActionsUseCase,
    private readonly getActionByIdUseCase: GetActionByIdUseCase,
    private readonly respondCorrectiveActionUseCase: RespondCorrectiveActionUseCase,
    private readonly submitResolutionPhotoUseCase: SubmitResolutionPhotoUseCase,
    private readonly reviewCorrectiveClosureUseCase: ReviewCorrectiveClosureUseCase,
    private readonly reassignResponsibleUseCase: ReassignResponsibleUseCase,
    private readonly getClosedActionsUseCase: GetClosedActionsUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getActions(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: unknown,
  ) {
    const parsedQuery = actionsQuerySchema.safeParse(query);

    if (!parsedQuery.success) {
      const firstIssue = parsedQuery.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'query';
      throw new BadRequestException(`${field}: ${firstIssue?.message}`);
    }

    const actions = await this.getActionsUseCase.execute(
      currentUser.sub,
      currentUser.roleId,
      parsedQuery.data,
    );

    return buildApiResponse(
      actions,
      'Acciones correctivas obtenidas correctamente',
    );
  }

  @Get('closed')
  @HttpCode(HttpStatus.OK)
  async getClosedActions(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: unknown,
  ) {
    const parsedQuery = actionsQuerySchema.safeParse(query);

    if (!parsedQuery.success) {
      const firstIssue = parsedQuery.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'query';
      throw new BadRequestException(`${field}: ${firstIssue?.message}`);
    }

    const rows = await this.getClosedActionsUseCase.execute({
      ...parsedQuery.data,
      status: 'closed',
    });

    return buildApiResponse(rows, 'Acciones cerradas obtenidas correctamente');
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getActionById(
    @Param('id') actionId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const action = await this.getActionByIdUseCase.execute(
      actionId,
      currentUser.sub,
      currentUser.roleId,
    );

    return buildApiResponse(action, 'Acción correctiva obtenida correctamente');
  }

  @Post(':id/respond')
  @HttpCode(HttpStatus.OK)
  async respond(
    @Param('id') actionId: string,
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: unknown,
  ) {
    const parsedBody = respondCorrectiveActionBodySchema.safeParse(body);

    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'body';
      throw new BadRequestException(`${field}: ${firstIssue?.message}`);
    }

    const result = await this.respondCorrectiveActionUseCase.execute({
      actionId,
      userId: currentUser.sub,
      correctivePlan: parsedBody.data.correctivePlan,
      commitmentDate: parsedBody.data.commitmentDate,
      signatureDataUrl: parsedBody.data.signatureDataUrl,
      resolutionPhotoDataUrl: parsedBody.data.resolutionPhotoDataUrl,
      changeReason: parsedBody.data.changeReason,
    });

    return buildApiResponse(
      result,
      'Acción correctiva respondida correctamente',
    );
  }

  @Post(':id/resolution')
  @HttpCode(HttpStatus.OK)
  async submitResolution(
    @Param('id') actionId: string,
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: unknown,
  ) {
    const parsedBody = submitResolutionPhotoBodySchema.safeParse(body);

    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'body';
      throw new BadRequestException(`${field}: ${firstIssue?.message}`);
    }

    const result = await this.submitResolutionPhotoUseCase.execute({
      actionId,
      userId: currentUser.sub,
      resolutionPhotoDataUrl: parsedBody.data.resolutionPhotoDataUrl,
    });

    return buildApiResponse(
      result,
      'Evidencia de resolución registrada correctamente',
    );
  }

  @Post(':id/closure-review')
  @HttpCode(HttpStatus.OK)
  async reviewClosure(
    @Param('id') actionId: string,
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: unknown,
  ) {
    const parsedBody = reviewCorrectiveClosureBodySchema.safeParse(body);

    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'body';
      throw new BadRequestException(`${field}: ${firstIssue?.message}`);
    }

    const result = await this.reviewCorrectiveClosureUseCase.execute({
      actionId,
      reviewerUserId: currentUser.sub,
      reviewerRoleId: currentUser.roleId,
      decision: parsedBody.data.decision,
      reviewNotes: parsedBody.data.reviewNotes,
    });

    const message =
      parsedBody.data.decision === 'approve'
        ? 'Acción correctiva cerrada correctamente'
        : 'Cierre rechazado; la acción fue reabierta para el responsable';

    return buildApiResponse(result, message);
  }

  @Patch(':id/reassign')
  @HttpCode(HttpStatus.OK)
  async reassign(
    @Param('id') actionId: string,
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: unknown,
  ) {
    const parsedBody = reassignResponsibleBodySchema.safeParse(body);

    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'body';
      throw new BadRequestException(`${field}: ${firstIssue?.message}`);
    }

    await this.reassignResponsibleUseCase.execute({
      actionId,
      newResponsibleId: parsedBody.data.newResponsibleId,
      requesterRoleId: currentUser.roleId,
    });

    return buildApiResponse(null, 'Responsable reasignado correctamente');
  }
}
