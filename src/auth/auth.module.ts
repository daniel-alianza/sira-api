import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { EnvVariables } from '../config/env-validation';
import { AUTH_USER_REPOSITORY } from './application/interfaces/auth-user.port';
import { JWT_AUTH } from './application/interfaces/jwt.auth.port';
import { ROLE_REPOSITORY } from './application/interfaces/role.port';
import { REGISTER_USER_REPOSITORY } from './application/interfaces/register-user.port';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { PasswordRegisterUseCase } from './application/use-cases/password-register.use-case';
import { PasswordVerifyUseCase } from './application/use-cases/password-verify.use-case';
import { RegisterToAppUseCase } from './application/use-cases/register-to-app.use-case';
import { NestJwtAuthAdapter, JwtStrategy } from './infrastructure/jwt';
import { PrismaAuthUserRepository } from './infrastructure/prisma-auth-user.repository';
import { PrismaRegisterUserRepository } from './infrastructure/prisma-register-user.repository';
import { PrismaRoleRepository } from './infrastructure/prisma-role.repository';
import { AuthController } from './presentation/auth.controller';
import { RolesGuard } from './presentation/guards/roles.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvVariables, true>) => ({
        secret: configService.get('JWT_SECRET', { infer: true }),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', { infer: true }),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    PasswordRegisterUseCase,
    PasswordVerifyUseCase,
    RegisterToAppUseCase,
    LoginUseCase,
    GetCurrentUserUseCase,
    JwtStrategy,
    {
      provide: REGISTER_USER_REPOSITORY,
      useClass: PrismaRegisterUserRepository,
    },
    {
      provide: AUTH_USER_REPOSITORY,
      useClass: PrismaAuthUserRepository,
    },
    {
      provide: JWT_AUTH,
      useClass: NestJwtAuthAdapter,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: PrismaRoleRepository,
    },
    RolesGuard,
  ],
  exports: [
    PasswordRegisterUseCase,
    GetCurrentUserUseCase,
    RolesGuard,
    ROLE_REPOSITORY,
  ],
})
export class AuthModule {}
