import { z } from 'zod';

export const notifyCorrectiveActionsBulkBodySchema = z.object({
  actionIds: z
    .array(z.string().uuid('Cada id de acción debe ser un UUID válido'))
    .min(1, 'Debes indicar al menos una acción'),
});

export type NotifyCorrectiveActionsBulkBodyDto = z.infer<
  typeof notifyCorrectiveActionsBulkBodySchema
>;
