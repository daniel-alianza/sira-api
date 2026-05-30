import type { Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../../../config/auth.config';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function setAccessTokenCookie(
  response: Response,
  accessToken: string,
  isProduction: boolean,
): void {
  response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: ONE_DAY_MS,
    path: '/',
  });
}

export function clearAccessTokenCookie(
  response: Response,
  isProduction: boolean,
): void {
  response.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
}
