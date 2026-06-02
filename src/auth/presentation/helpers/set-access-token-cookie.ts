import type { Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../../../config/auth.config';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getCookieSecurityOptions(isProduction: boolean) {
  return {
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  } as const;
}

export function setAccessTokenCookie(
  response: Response,
  accessToken: string,
  isProduction: boolean,
): void {
  const cookieSecurityOptions = getCookieSecurityOptions(isProduction);

  response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    ...cookieSecurityOptions,
    maxAge: ONE_DAY_MS,
    path: '/',
  });
}

export function clearAccessTokenCookie(
  response: Response,
  isProduction: boolean,
): void {
  const cookieSecurityOptions = getCookieSecurityOptions(isProduction);

  response.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    ...cookieSecurityOptions,
    path: '/',
  });
}
