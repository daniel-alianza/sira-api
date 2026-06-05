import { z } from 'zod';

const evidencePhotoDataUrlSchema = z
  .string()
  .regex(
    /^data:image\/(png|jpeg|jpg|webp);base64,/,
    'La imagen debe ser PNG, JPEG o WEBP en base64',
  );

export const submitDetectionEvidenceBodySchema = z.object({
  evidencePhotoDataUrl: evidencePhotoDataUrlSchema,
});

export type SubmitDetectionEvidenceBodyDto = z.infer<
  typeof submitDetectionEvidenceBodySchema
>;
