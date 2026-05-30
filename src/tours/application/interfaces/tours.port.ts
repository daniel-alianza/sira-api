import type {
  RegisterWalkthroughInput,
  RegisterWalkthroughResult,
  TourCorrectiveActionRow,
  TourPeriod,
} from './tours.interface';

export interface ToursRepositoryPort {
  registerWalkthrough(
    input: RegisterWalkthroughInput,
  ): Promise<RegisterWalkthroughResult>;
  findDetectionsByInspectorAndPeriod(
    inspectorId: string,
    period: TourPeriod,
  ): Promise<TourCorrectiveActionRow[]>;
  findDetectionsByPeriod(
    period: TourPeriod,
  ): Promise<TourCorrectiveActionRow[]>;
}

export const TOURS_REPOSITORY = Symbol('TOURS_REPOSITORY');
