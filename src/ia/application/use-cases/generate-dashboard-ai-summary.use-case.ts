import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvVariables } from '../../../config/env-validation';
import {
  DASHBOARD_REPOSITORY,
  type DashboardRepositoryPort,
} from '../../../dashboard/application/interfaces/dashboard.port';
import type { DashboardQueryFilter } from '../../../dashboard/application/interfaces/dashboard.interface';
import { buildDashboardMetricsFingerprint } from '../helpers/build-dashboard-metrics-fingerprint.helper';
import { buildIaSummaryBatchCacheKey } from '../helpers/build-ia-summary-batch-cache-key.helper';
import { buildIaSummaryCacheKey } from '../helpers/build-ia-summary-cache-key.helper';
import { buildStaticDashboardAiSummary } from '../helpers/build-static-dashboard-ai-summary.helper';
import { shouldUseFallbackHybridNarrative } from '../helpers/build-fallback-hybrid-narrative.helper';
import { mergeHybridDashboardAiSummary } from '../helpers/merge-hybrid-dashboard-ai-summary.helper';
import { sanitizeDashboardAiSummaryText } from '../helpers/sanitize-dashboard-ai-summary-text.helper';
import { sanitizeHybridIaNarrative } from '../helpers/personalize-hybrid-ia-narrative.helper';
import { resolveDashboardIaQueryFilter } from '../helpers/resolve-dashboard-ia-query-filter.helper';
import { formatDashboardGeneratedAt } from '../helpers/dashboard-metrics.helper';
import { parseDashboardAiSummaryPayload } from '../helpers/parse-dashboard-ai-summary.helper';
import type {
  DashboardAiSummary,
  DashboardIaViewer,
} from '../interfaces/dashboard-metrics.interface';
import type { HybridIaNarrative } from '../interfaces/hybrid-ia-narrative.interface';
import {
  IA_COMPLETION_PORT,
  type IaCompletionPort,
} from '../interfaces/ia-completion.port';
import {
  IA_SUMMARY_BATCH_CACHE_PORT,
  type IaSummaryBatchCachePort,
} from '../interfaces/ia-summary-batch-cache.port';
import {
  IA_SUMMARY_CACHE_PORT,
  type IaSummaryCachePort,
} from '../interfaces/ia-summary-cache.port';
import {
  IA_SUMMARY_RATE_LIMIT_PORT,
  type IaSummaryRateLimitPort,
} from '../interfaces/ia-summary-rate-limit.port';
import {
  buildDashboardAiUserMessage,
  DASHBOARD_AI_SYSTEM_PROMPT,
} from '../../utils/prompt';
import { GenerateHybridIaNarrativeUseCase } from './generate-hybrid-ia-narrative.use-case';

export interface GenerateDashboardAiSummaryInput {
  readonly filter: DashboardQueryFilter;
  readonly viewer: DashboardIaViewer;
  readonly userId: string;
  readonly refresh?: boolean;
}

@Injectable()
export class GenerateDashboardAiSummaryUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: DashboardRepositoryPort,
    @Inject(IA_COMPLETION_PORT)
    private readonly iaCompletionPort: IaCompletionPort,
    @Inject(IA_SUMMARY_CACHE_PORT)
    private readonly iaSummaryCachePort: IaSummaryCachePort,
    @Inject(IA_SUMMARY_BATCH_CACHE_PORT)
    private readonly iaSummaryBatchCachePort: IaSummaryBatchCachePort,
    @Inject(IA_SUMMARY_RATE_LIMIT_PORT)
    private readonly iaSummaryRateLimitPort: IaSummaryRateLimitPort,
    private readonly generateHybridIaNarrativeUseCase: GenerateHybridIaNarrativeUseCase,
    private readonly configService: ConfigService<EnvVariables, true>,
  ) {}

  async execute(
    input: GenerateDashboardAiSummaryInput,
  ): Promise<DashboardAiSummary> {
    const timeZone = this.configService.get('TIMEZONE', { infer: true });
    const resolvedIaQuery = resolveDashboardIaQueryFilter({
      filter: input.filter,
      viewerRoleName: input.viewer.roleName,
      viewerAreaId: input.viewer.areaId,
      viewerCompanyId: input.viewer.companyId,
    });

    const iaContext = await this.dashboardRepository.getIaContext({
      filter: resolvedIaQuery.filter,
      analysisScope: resolvedIaQuery.analysisScope,
      analysisScopeLabel: resolvedIaQuery.analysisScopeLabel,
    });

    const metricsFingerprint = buildDashboardMetricsFingerprint(iaContext);
    const cacheKey = buildIaSummaryCacheKey({
      userId: input.userId,
      periodFrom: iaContext.period.from,
      periodTo: iaContext.period.to,
      filter: resolvedIaQuery.filter,
      metricsFingerprint,
    });

    if (!input.refresh) {
      const cachedSummary = await this.iaSummaryCachePort.get(cacheKey);

      if (cachedSummary) {
        return sanitizeDashboardAiSummaryText({
          ...cachedSummary,
          fromCache: true,
        });
      }
    }

    const hybridEnabled = this.configService.get('IA_HYBRID_SUMMARY_ENABLED', {
      infer: true,
    });

    const summary = hybridEnabled
      ? await this.buildHybridSummary({
          iaContext,
          viewer: input.viewer,
          userId: input.userId,
          timeZone,
          resolvedFilter: resolvedIaQuery.filter,
        })
      : await this.buildFullIaSummary({
          iaContext,
          viewer: input.viewer,
          userId: input.userId,
          timeZone,
        });

    const cacheTtlSeconds = this.configService.get(
      'IA_SUMMARY_CACHE_TTL_SECONDS',
      { infer: true },
    );

    await this.iaSummaryCachePort.set(cacheKey, summary, cacheTtlSeconds);

    return summary;
  }

  private async buildHybridSummary(input: {
    readonly iaContext: Awaited<
      ReturnType<DashboardRepositoryPort['getIaContext']>
    >;
    readonly viewer: DashboardIaViewer;
    readonly userId: string;
    readonly timeZone: string;
    readonly resolvedFilter: DashboardQueryFilter;
  }): Promise<DashboardAiSummary> {
    const staticPart = buildStaticDashboardAiSummary({
      context: input.iaContext,
      viewerFullName: input.viewer.fullName,
    });

    const metricsFingerprint = buildDashboardMetricsFingerprint(input.iaContext);
    const batchKey = buildIaSummaryBatchCacheKey({
      periodFrom: input.iaContext.period.from,
      periodTo: input.iaContext.period.to,
      filter: input.resolvedFilter,
    });

    let narrative: HybridIaNarrative | null = null;
    let fromBatch = false;

    if (this.configService.get('IA_WEEKLY_BATCH_ENABLED', { infer: true })) {
      const batchEntry = await this.iaSummaryBatchCachePort.get(batchKey);

      if (batchEntry?.metricsFingerprint === metricsFingerprint) {
        narrative = batchEntry.narrative;
        fromBatch = true;
      }
    }

    if (!narrative) {
      if (!shouldUseFallbackHybridNarrative(input.iaContext)) {
        await this.assertRateLimit(input.userId);
      }

      narrative = await this.generateHybridIaNarrativeUseCase.execute({
        context: input.iaContext,
      });

      if (this.configService.get('IA_WEEKLY_BATCH_ENABLED', { infer: true })) {
        const cacheTtlSeconds = this.configService.get(
          'IA_SUMMARY_CACHE_TTL_SECONDS',
          { infer: true },
        );

        await this.iaSummaryBatchCachePort.set(
          batchKey,
          { metricsFingerprint, narrative },
          cacheTtlSeconds,
        );
      }
    }

    const sanitizedNarrative = sanitizeHybridIaNarrative(narrative);

    return sanitizeDashboardAiSummaryText(
      mergeHybridDashboardAiSummary({
        generatedAt: formatDashboardGeneratedAt(new Date(), input.timeZone),
        staticPart,
        narrative: sanitizedNarrative,
        fromCache: fromBatch,
      }),
    );
  }

  private async buildFullIaSummary(input: {
    readonly iaContext: Awaited<
      ReturnType<DashboardRepositoryPort['getIaContext']>
    >;
    readonly viewer: DashboardIaViewer;
    readonly userId: string;
    readonly timeZone: string;
  }): Promise<DashboardAiSummary> {
    await this.assertRateLimit(input.userId);

    const rawResponse =
      await this.iaCompletionPort.generateDashboardSummaryJson({
        systemPrompt: DASHBOARD_AI_SYSTEM_PROMPT,
        userMessage: buildDashboardAiUserMessage(
          input.iaContext,
          input.viewer,
        ),
      });

    let parsedSummary;
    try {
      parsedSummary = parseDashboardAiSummaryPayload(rawResponse);
    } catch {
      throw new BadRequestException(
        'La IA devolvió un formato inválido. Revisa tu prompt o intenta de nuevo.',
      );
    }

    return sanitizeDashboardAiSummaryText({
      generatedAt: formatDashboardGeneratedAt(new Date(), input.timeZone),
      headline: parsedSummary.headline,
      paragraphs: parsedSummary.paragraphs,
      highlights: parsedSummary.highlights,
      trendNote: parsedSummary.trendNote,
      riskNote: parsedSummary.riskNote,
      fromCache: false,
    });
  }

  private async assertRateLimit(userId: string): Promise<void> {
    const rateLimit = await this.iaSummaryRateLimitPort.consume(userId);

    if (!rateLimit.allowed) {
      throw new HttpException(
        `Límite de resúmenes de IA alcanzado. Intenta de nuevo en ${rateLimit.retryAfterSeconds} segundos.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
