import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { USER_REPOSITORY } from './application/interfaces/user.port';
import { GetAllUsersUseCase } from './application/use-cases/get-all-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [
    GetAllUsersUseCase,
    UpdateUserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
})
export class UsersModule {}
