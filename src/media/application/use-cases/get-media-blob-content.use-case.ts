import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { MediaBlobContent } from '../interfaces/media-blob.interface';
import {
  MEDIA_BLOB_REPOSITORY,
  type MediaBlobRepositoryPort,
} from '../interfaces/media-blob.port';

@Injectable()
export class GetMediaBlobContentUseCase {
  constructor(
    @Inject(MEDIA_BLOB_REPOSITORY)
    private readonly mediaBlobRepository: MediaBlobRepositoryPort,
  ) {}

  async execute(mediaId: string): Promise<MediaBlobContent> {
    const media = await this.mediaBlobRepository.findContentById(mediaId);

    if (!media) {
      throw new NotFoundException('Archivo multimedia no encontrado');
    }

    return media;
  }
}
