import type { Prisma } from '../../../../generated/prisma/client';
import { MediaBlobKind } from '../../../../generated/prisma/client';
import {
  IMAGE_DATA_URL_PATTERN,
  parseImageDataUrl,
  SIGNATURE_DATA_URL_PATTERN,
} from './image-data-url.helper';

const SIGNATURE_MAX_BYTES = 2 * 1024 * 1024;
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

type MediaBlobTransactionClient = Pick<Prisma.TransactionClient, 'mediaBlob'>;

export async function createMediaBlobInTransaction(
  transaction: MediaBlobTransactionClient,
  input: {
    readonly kind: MediaBlobKind;
    readonly dataUrl: string;
    readonly uploadedById: string;
  },
): Promise<string> {
  const isSignature = input.kind === MediaBlobKind.CORRECTIVE_SIGNATURE;
  const parsed = parseImageDataUrl(
    input.dataUrl,
    isSignature ? SIGNATURE_DATA_URL_PATTERN : IMAGE_DATA_URL_PATTERN,
    isSignature
      ? 'La firma debe enviarse como imagen PNG o JPEG en base64'
      : 'La imagen debe ser PNG, JPEG o WEBP en base64',
    isSignature ? SIGNATURE_MAX_BYTES : PHOTO_MAX_BYTES,
  );

  const created = await transaction.mediaBlob.create({
    data: {
      kind: input.kind,
      mimeType: parsed.mimeType,
      sizeBytes: parsed.buffer.length,
      content: Uint8Array.from(parsed.buffer),
      uploadedById: input.uploadedById,
    },
    select: { id: true },
  });

  return created.id;
}
