import { z } from 'zod';

const tourDetectionTypeSchema = z.enum(['unsafe_act', 'unsafe_condition']);

const imageDataUrlSchema = z
  .string()
  .regex(
    /^data:image\/(png|jpeg|jpg|webp);base64,/,
    'La imagen debe ser PNG, JPEG o WEBP en base64',
  )
  .optional();

export const registerWalkthroughDetectionSchema = z.object({
  folio: z.string().min(1, 'El folio de detección es requerido'),
  companyId: z.string().min(1, 'Selecciona una empresa'),
  branchId: z.string().min(1, 'Selecciona una sucursal'),
  areaId: z.string().min(1, 'Selecciona un área'),
  detectionType: tourDetectionTypeSchema,
  description: z.string().min(5, 'Describe el hallazgo (mín. 5 caracteres)'),
  responsibleId: z.string().min(1, 'Selecciona un responsable'),
  evidencePhotoDataUrl: imageDataUrlSchema,
});

export const registerWalkthroughBodySchema = z.object({
  folio: z.string().min(1, 'El folio del recorrido es requerido'),
  startedAt: z
    .string()
    .min(1, 'La fecha de inicio es requerida')
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'La fecha de inicio no es válida',
    }),
  detections: z.array(registerWalkthroughDetectionSchema),
});

export const tourDetectionsQuerySchema = z.object({
  period: z.enum(['day', 'week'], {
    message: 'El periodo debe ser day o week',
  }),
});

export type RegisterWalkthroughBodyDto = z.infer<
  typeof registerWalkthroughBodySchema
>;

export type TourDetectionsQueryDto = z.infer<typeof tourDetectionsQuerySchema>;
