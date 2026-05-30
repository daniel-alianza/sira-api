import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TOURS_REPOSITORY } from './application/interfaces/tours.port';
import { GetTourDetectionsUseCase } from './application/use-cases/get-tour-detections.use-case';
import { ToursToRegisterUseCase } from './application/use-cases/tours-to-register.use-case';
import { PrismaRegisterToursRepository } from './infrastructure/prisma-register-tours.repository';
import { ToursController } from './presentation/tours.controller';

@Module({
  imports: [AuthModule],
  controllers: [ToursController],
  providers: [
    ToursToRegisterUseCase,
    GetTourDetectionsUseCase,
    {
      provide: TOURS_REPOSITORY,
      useClass: PrismaRegisterToursRepository,
    },
  ],
})
export class ToursModule {}
