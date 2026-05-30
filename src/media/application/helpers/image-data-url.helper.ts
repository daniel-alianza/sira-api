import { BadRequestException } from '@nestjs/common';

export interface ParsedImageDataUrl {
  readonly buffer: Buffer;
  readonly mimeType: string;
  readonly extension: string;
}

export function parseImageDataUrl(
  dataUrl: string,
  pattern: RegExp,
  invalidFormatMessage: string,
  maxSizeBytes: number,
): ParsedImageDataUrl {
  const match = pattern.exec(dataUrl.trim());

  if (!match) {
    throw new BadRequestException(invalidFormatMessage);
  }

  const mimeSubtype = match[1];
  const base64Payload = match[2];
  const buffer = Buffer.from(base64Payload, 'base64');

  if (buffer.length === 0) {
    throw new BadRequestException('La imagen está vacía');
  }

  if (buffer.length > maxSizeBytes) {
    throw new BadRequestException('La imagen supera el tamaño máximo permitido');
  }

  const extension =
    mimeSubtype === 'jpeg' || mimeSubtype === 'jpg'
      ? 'jpg'
      : mimeSubtype === 'webp'
        ? 'webp'
        : 'png';

  const mimeType =
    mimeSubtype === 'jpeg' || mimeSubtype === 'jpg'
      ? 'image/jpeg'
      : mimeSubtype === 'webp'
        ? 'image/webp'
        : 'image/png';

  return { buffer, mimeType, extension };
}

export const IMAGE_DATA_URL_PATTERN =
  /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/;

export const SIGNATURE_DATA_URL_PATTERN =
  /^data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)$/;
