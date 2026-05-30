import { z } from 'zod';

const resolutionPhotoDataUrlSchema = z
  .string()
  .regex(
    /^data:image\/(png|jpeg|jpg|webp);base64,/,
    'La imagen debe ser PNG, JPEG o WEBP en base64',
  );

export const submitResolutionPhotoBodySchema = z.object({
  resolutionPhotoDataUrl: resolutionPhotoDataUrlSchema,
});

export type SubmitResolutionPhotoBodyDto = z.infer<
  typeof submitResolutionPhotoBodySchema
>;
