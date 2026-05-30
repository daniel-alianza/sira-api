import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { IA_COMPLETION_PORT } from './application/interfaces/ia-completion.port';
import { IA_SUMMARY_BATCH_CACHE_PORT } from './application/interfaces/ia-summary-batch-cache.port';
import { IA_SUMMARY_CACHE_PORT } from './application/interfaces/ia-summary-cache.port';
import { IA_SUMMARY_RATE_LIMIT_PORT } from './application/interfaces/ia-summary-rate-limit.port';
import { GenerateDashboardAiSummaryUseCase } from './application/use-cases/generate-dashboard-ai-summary.use-case';
import { GenerateHybridIaNarrativeUseCase } from './application/use-cases/generate-hybrid-ia-narrative.use-case';
import { PrewarmWeeklyIaSummariesUseCase } from './application/use-cases/prewarm-weekly-ia-summaries.use-case';
import { AnthropicIaCompletionAdapter } from './infrastructure/anthropic-ia-completion.adapter';
import { InMemoryIaSummaryBatchCacheAdapter } from './infrastructure/in-memory-ia-summary-batch-cache.adapter';
import { InMemoryIaSummaryCacheAdapter } from './infrastructure/in-memory-ia-summary-cache.adapter';
import { InMemoryIaSummaryRateLimitAdapter } from './infrastructure/in-memory-ia-summary-rate-limit.adapter';
import { WeeklyIaSummaryBatchScheduler } from './infrastructure/weekly-ia-summary-batch.scheduler';
import { IaController } from './presentation/ia.controller';

@Module({
  imports: [AuthModule, DashboardModule],
  controllers: [IaController],
  providers: [
    GenerateDashboardAiSummaryUseCase,
    GenerateHybridIaNarrativeUseCase,
    PrewarmWeeklyIaSummariesUseCase,
    WeeklyIaSummaryBatchScheduler,
    {
      provide: IA_COMPLETION_PORT,
      useClass: AnthropicIaCompletionAdapter,
    },
    {
      provide: IA_SUMMARY_CACHE_PORT,
      useClass: InMemoryIaSummaryCacheAdapter,
    },
    {
      provide: IA_SUMMARY_BATCH_CACHE_PORT,
      useClass: InMemoryIaSummaryBatchCacheAdapter,
    },
    {
      provide: IA_SUMMARY_RATE_LIMIT_PORT,
      useClass: InMemoryIaSummaryRateLimitAdapter,
    },
  ],
})
export class IaModule {}
