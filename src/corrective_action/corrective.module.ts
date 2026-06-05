import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CORRECTIVE_ACTION_REPOSITORY } from './application/interfaces/corrective.port';
import { GetActionsUseCase } from './application/use-cases/get-actions.use-case';
import { GetActionByIdUseCase } from './application/use-cases/get-action-by-id.use-case';
import { RespondCorrectiveActionUseCase } from './application/use-cases/respond-corrective-action.use-case';
import { ReviewCorrectiveClosureUseCase } from './application/use-cases/review-corrective-closure.use-case';
import { SubmitDetectionEvidenceUseCase } from './application/use-cases/submit-detection-evidence.use-case';
import { SubmitResolutionPhotoUseCase } from './application/use-cases/submit-resolution-photo.use-case';
import { ReassignResponsibleUseCase } from './application/use-cases/reassign-responsible.use-case';
import { GetClosedActionsUseCase } from './application/use-cases/get-closed-actions.use-case';
import { PrismaCorrectiveActionRepository } from './infrastructure/prisma-corrective-action.repository';
import { CorrectiveController } from './presentation/corrective.controller';

@Module({
  imports: [AuthModule],
  controllers: [CorrectiveController],
  providers: [
    GetActionsUseCase,
    GetActionByIdUseCase,
    RespondCorrectiveActionUseCase,
    SubmitDetectionEvidenceUseCase,
    SubmitResolutionPhotoUseCase,
    ReviewCorrectiveClosureUseCase,
    ReassignResponsibleUseCase,
    GetClosedActionsUseCase,
    {
      provide: CORRECTIVE_ACTION_REPOSITORY,
      useClass: PrismaCorrectiveActionRepository,
    },
  ],
})
export class CorrectiveModule {}
