import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type {
  CreateMediaBlobInput,
  MediaBlobContent,
} from '../application/interfaces/media-blob.interface';
import type { MediaBlobRepositoryPort } from '../application/interfaces/media-blob.port';

@Injectable()
export class PrismaMediaBlobRepository implements MediaBlobRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateMediaBlobInput): Promise<string> {
    const created = await this.prisma.mediaBlob.create({
      data: {
        kind: input.kind,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        content: Uint8Array.from(input.content),
        uploadedById: input.uploadedById,
      },
      select: { id: true },
    });

    return created.id;
  }

  async findContentById(id: string): Promise<MediaBlobContent | null> {
    const media = await this.prisma.mediaBlob.findUnique({
      where: { id },
      select: {
        id: true,
        mimeType: true,
        content: true,
      },
    });

    if (!media) {
      return null;
    }

    return {
      id: media.id,
      mimeType: media.mimeType,
      content: Buffer.from(media.content),
    };
  }
}
