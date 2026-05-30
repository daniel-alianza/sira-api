import { z } from 'zod';

export const registerBodySchema = z
  .object({
    name: z
      .string()
      .min(1, 'El nombre es requerido')
      .min(2, 'Mínimo 2 caracteres'),
    email: z
      .string()
      .min(1, 'El correo electrónico es requerido')
      .email('Ingresa un correo válido'),
    password: z
      .string()
      .min(1, 'La contraseña es requerida')
      .min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    empresaId: z.string().min(1, 'Selecciona una empresa'),
    sucursalId: z.string().min(1, 'Selecciona una sucursal'),
    areaId: z.string().min(1, 'Selecciona un área'),
    roleId: z.string().min(1).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterBodyDto = z.infer<typeof registerBodySchema>;
