import { z } from 'zod';

export const directCloseCorrectiveActionBodySchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, 'Indica el motivo del cierre directo (mínimo 10 caracteres)'),
});

export type DirectCloseCorrectiveActionBodyDto = z.infer<
  typeof directCloseCorrectiveActionBodySchema
>;
