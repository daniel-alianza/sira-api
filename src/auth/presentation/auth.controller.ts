import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { buildApiResponse } from '../../common/helpers/build-api-response';
import type { EnvVariables } from '../../config/env-validation';
import type { RegisterInterface } from '../application/interfaces/register.interface';
import { GetCurrentUserUseCase } from '../application/use-cases/get-current-user.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RegisterToAppUseCase } from '../application/use-cases/register-to-app.use-case';
import { CurrentUser } from './decorators/current-user.decorator';
import { loginBodySchema } from './dtos/login.dto';
import { registerBodySchema } from './dtos/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  clearAccessTokenCookie,
  setAccessTokenCookie,
} from './helpers/set-access-token-cookie';
import type { JwtPayload } from '../application/interfaces/jwt.auth.port';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerToAppUseCase: RegisterToAppUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly configService: ConfigService<EnvVariables, true>,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: unknown) {
    const parsedBody = registerBodySchema.safeParse(body);

    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'body';
      throw new BadRequestException(`${field}: ${firstIssue?.message}`);
    }

    const payload: RegisterInterface = {
      name: parsedBody.data.name,
      email: parsedBody.data.email,
      password: parsedBody.data.password,
      companyId: parsedBody.data.empresaId,
      branchId: parsedBody.data.sucursalId,
      areaId: parsedBody.data.areaId,
      roleId: parsedBody.data.roleId ?? '',
    };

    const user = await this.registerToAppUseCase.execute(payload);

    return buildApiResponse(user, 'Usuario registrado correctamente');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const parsedBody = loginBodySchema.safeParse(body);

    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'body';
      throw new BadRequestException(`${field}: ${firstIssue?.message}`);
    }

    const loginResult = await this.loginUseCase.execute(parsedBody.data);

    setAccessTokenCookie(
      response,
      loginResult.accessToken,
      this.configService.get('NODE_ENV', { infer: true }) === 'production',
    );

    return buildApiResponse(loginResult.user, 'Inicio de sesión exitoso');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) response: Response) {
    clearAccessTokenCookie(
      response,
      this.configService.get('NODE_ENV', { infer: true }) === 'production',
    );

    return buildApiResponse(null, 'Sesión cerrada correctamente');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() currentUser: JwtPayload) {
    const user = await this.getCurrentUserUseCase.execute(currentUser.sub);

    return buildApiResponse(user, 'Sesión activa');
  }
}
