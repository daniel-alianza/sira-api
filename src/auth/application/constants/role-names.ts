export const ROLE_ADMINISTRATOR = 'Administrador';
export const ROLE_INSPECTOR = 'Inspector';
export const ROLE_RESPONSIBLE = 'Responsable';

export const APP_ROLE_NAMES = [
  ROLE_ADMINISTRATOR,
  ROLE_INSPECTOR,
  ROLE_RESPONSIBLE,
] as const;

export type AppRoleName = (typeof APP_ROLE_NAMES)[number];
