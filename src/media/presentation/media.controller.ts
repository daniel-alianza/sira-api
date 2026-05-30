import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { GetMediaBlobContentUseCase } from '../application/use-cases/get-media-blob-content.use-case';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(
    private readonly getMediaBlobContentUseCase: GetMediaBlobContentUseCase,
  ) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getMedia(@Param('id') mediaId: string, @Res() response: Response) {
    const media = await this.getMediaBlobContentUseCase.execute(mediaId);

    response.setHeader('Content-Type', media.mimeType);
    response.setHeader('Cache-Control', 'private, max-age=3600');
    response.send(media.content);
  }
}
