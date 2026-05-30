import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvVariables } from '../../config/env-validation';
import { PrewarmWeeklyIaSummariesUseCase } from '../application/use-cases/prewarm-weekly-ia-summaries.use-case';

@Injectable()
export class WeeklyIaSummaryBatchScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(WeeklyIaSummaryBatchScheduler.name);
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(
    private readonly prewarmWeeklyIaSummariesUseCase: PrewarmWeeklyIaSummariesUseCase,
    private readonly configService: ConfigService<EnvVariables, true>,
  ) {}

  onModuleInit(): void {
    if (!this.configService.get('IA_WEEKLY_BATCH_ENABLED', { infer: true })) {
      return;
    }

    void this.runPrewarm('startup');

    const intervalSeconds = this.configService.get(
      'IA_WEEKLY_BATCH_INTERVAL_SECONDS',
      { infer: true },
    );

    this.intervalHandle = setInterval(() => {
      void this.runPrewarm('interval');
    }, intervalSeconds * 1000);
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private async runPrewarm(trigger: 'startup' | 'interval'): Promise<void> {
    try {
      await this.prewarmWeeklyIaSummariesUseCase.execute();
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'ia_weekly_batch_failed',
          trigger,
          message: error instanceof Error ? error.message : 'unknown_error',
        }),
      );
    }
  }
}
