import { Inject, Injectable } from '@nestjs/common';
import {
  IMAGE_DATA_URL_PATTERN,
  parseImageDataUrl,
  SIGNATURE_DATA_URL_PATTERN,
} from '../helpers/image-data-url.helper';
import type {
  CreateMediaBlobInput,
  MediaBlobKind,
} from '../interfaces/media-blob.interface';
import {
  MEDIA_BLOB_REPOSITORY,
  type MediaBlobRepositoryPort,
} from '../interfaces/media-blob.port';

const SIGNATURE_MAX_BYTES = 2 * 1024 * 1024;
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class CreateMediaBlobFromDataUrlUseCase {
  constructor(
    @Inject(MEDIA_BLOB_REPOSITORY)
    private readonly mediaBlobRepository: MediaBlobRepositoryPort,
  ) {}

  async execute(
    kind: MediaBlobKind,
    dataUrl: string,
    uploadedById: string,
  ): Promise<string> {
    const isSignature = kind === 'CORRECTIVE_SIGNATURE';
    const parsed = parseImageDataUrl(
      dataUrl,
      isSignature ? SIGNATURE_DATA_URL_PATTERN : IMAGE_DATA_URL_PATTERN,
      isSignature
        ? 'La firma debe enviarse como imagen PNG o JPEG en base64'
        : 'La imagen debe ser PNG, JPEG o WEBP en base64',
      isSignature ? SIGNATURE_MAX_BYTES : PHOTO_MAX_BYTES,
    );

    const input: CreateMediaBlobInput = {
      kind,
      mimeType: parsed.mimeType,
      sizeBytes: parsed.buffer.length,
      content: parsed.buffer,
      uploadedById,
    };

    return this.mediaBlobRepository.create(input);
  }
}
