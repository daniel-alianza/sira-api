import { z } from 'zod';

export const reassignResponsibleBodySchema = z.object({
  newResponsibleId: z.string().uuid('El ID del responsable no es válido'),
});

export type ReassignResponsibleBodyDto = z.infer<
  typeof reassignResponsibleBodySchema
>;
