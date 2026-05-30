import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MEDIA_BLOB_REPOSITORY } from './application/interfaces/media-blob.port';
import { CreateMediaBlobFromDataUrlUseCase } from './application/use-cases/create-media-blob-from-data-url.use-case';
import { GetMediaBlobContentUseCase } from './application/use-cases/get-media-blob-content.use-case';
import { PrismaMediaBlobRepository } from './infrastructure/prisma-media-blob.repository';
import { MediaController } from './presentation/media.controller';

@Module({
  imports: [AuthModule],
  controllers: [MediaController],
  providers: [
    CreateMediaBlobFromDataUrlUseCase,
    GetMediaBlobContentUseCase,
    {
      provide: MEDIA_BLOB_REPOSITORY,
      useClass: PrismaMediaBlobRepository,
    },
  ],
  exports: [CreateMediaBlobFromDataUrlUseCase, MEDIA_BLOB_REPOSITORY],
})
export class MediaModule {}
