import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtAuthPort, JwtPayload } from '../../application/interfaces/jwt.auth.port';

@Injectable()
export class NestJwtAuthAdapter implements JwtAuthPort {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
}
