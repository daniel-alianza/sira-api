import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingresa un correo válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'Mínimo 6 caracteres'),
});

export type LoginBodyDto = z.infer<typeof loginBodySchema>;
