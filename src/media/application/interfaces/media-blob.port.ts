import type {
  CreateMediaBlobInput,
  MediaBlobContent,
} from './media-blob.interface';

export const MEDIA_BLOB_REPOSITORY = Symbol('MEDIA_BLOB_REPOSITORY');

export interface MediaBlobRepositoryPort {
  create(input: CreateMediaBlobInput): Promise<string>;
  findContentById(id: string): Promise<MediaBlobContent | null>;
}
