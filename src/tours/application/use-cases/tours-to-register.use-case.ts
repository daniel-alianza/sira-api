import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type {
  RegisterWalkthroughInput,
  RegisterWalkthroughResult,
} from '../interfaces/tours.interface';
import {
  TOURS_REPOSITORY,
  type ToursRepositoryPort,
} from '../interfaces/tours.port';

@Injectable()
export class ToursToRegisterUseCase {
  constructor(
    @Inject(TOURS_REPOSITORY)
    private readonly toursRepository: ToursRepositoryPort,
  ) {}

  async execute(
    input: RegisterWalkthroughInput,
  ): Promise<RegisterWalkthroughResult> {
    if (input.startedAt.getTime() > Date.now()) {
      throw new BadRequestException('La fecha de inicio no puede ser futura');
    }

    const detectionFolios = input.detections.map(
      (detection) => detection.folio,
    );
    const uniqueDetectionFolios = new Set(detectionFolios);

    if (uniqueDetectionFolios.size !== detectionFolios.length) {
      throw new BadRequestException(
        'Los folios de detección deben ser únicos dentro del recorrido',
      );
    }

    return this.toursRepository.registerWalkthrough(input);
  }
}
