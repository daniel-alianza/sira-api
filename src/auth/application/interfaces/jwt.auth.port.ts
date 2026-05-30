export interface JwtPayload {
  sub: string;
  email: string;
  roleId: string;
}

export interface JwtAuthPort {
  sign(payload: JwtPayload): Promise<string>;
}

export const JWT_AUTH = Symbol('JWT_AUTH');
