import { z } from 'zod';

const imageDataUrlSchema = z
  .string()
  .regex(
    /^data:image\/(png|jpeg|jpg|webp);base64,/,
    'La imagen debe ser PNG, JPEG o WEBP en base64',
  );

const signatureDataUrlSchema = z
  .string()
  .min(1, 'La firma es requerida')
  .regex(
    /^data:image\/(png|jpeg|jpg);base64,/,
    'La firma debe ser una imagen PNG o JPEG en base64',
  );

export const respondCorrectiveActionBodySchema = z.object({
  correctivePlan: z
    .string()
    .trim()
    .min(5, 'Describe la acción correctiva (mín. 5 caracteres)'),
  commitmentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha compromiso debe ser YYYY-MM-DD'),
  signatureDataUrl: signatureDataUrlSchema,
  resolutionPhotoDataUrl: imageDataUrlSchema.optional(),
  changeReason: z.string().trim().optional(),
});

export type RespondCorrectiveActionBodyDto = z.infer<
  typeof respondCorrectiveActionBodySchema
>;
