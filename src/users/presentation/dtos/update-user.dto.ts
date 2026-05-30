import { z } from 'zod';

export const updateUserBodySchema = z
  .object({
    name: z.string().min(2, 'Mínimo 2 caracteres').optional(),
    email: z.string().email('Ingresa un correo válido').optional(),
    password: z.string().min(6, 'Mínimo 6 caracteres').optional(),
    empresaId: z.string().min(1, 'Selecciona una empresa').optional(),
    sucursalId: z.string().min(1, 'Selecciona una sucursal').optional(),
    areaId: z.string().min(1, 'Selecciona un área').optional(),
    roleId: z.string().min(1, 'Selecciona un rol').optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export type UpdateUserBodyDto = z.infer<typeof updateUserBodySchema>;
