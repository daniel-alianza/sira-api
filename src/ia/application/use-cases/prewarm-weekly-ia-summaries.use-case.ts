import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveCurrentWeekPeriod } from '../../../common/days-and-hours-work';
import type { EnvVariables } from '../../../config/env-validation';
import { ROLE_ADMINISTRATOR } from '../../../auth/application/constants/role-names';
import {
  DASHBOARD_REPOSITORY,
  type DashboardRepositoryPort,
} from '../../../dashboard/application/interfaces/dashboard.port';
import type { DashboardQueryFilter } from '../../../dashboard/application/interfaces/dashboard.interface';
import { GetDashboardOverviewUseCase } from '../../../dashboard/application/use-cases/get-dashboard-overview.use-case';
import { buildDashboardMetricsFingerprint } from '../helpers/build-dashboard-metrics-fingerprint.helper';
import { buildIaSummaryBatchCacheKey } from '../helpers/build-ia-summary-batch-cache-key.helper';
import { resolveDashboardIaQueryFilter } from '../helpers/resolve-dashboard-ia-query-filter.helper';
import {
  IA_SUMMARY_BATCH_CACHE_PORT,
  type IaSummaryBatchCachePort,
} from '../interfaces/ia-summary-batch-cache.port';
import { GenerateHybridIaNarrativeUseCase } from './generate-hybrid-ia-narrative.use-case';

@Injectable()
export class PrewarmWeeklyIaSummariesUseCase {
  private readonly logger = new Logger(PrewarmWeeklyIaSummariesUseCase.name);

  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: DashboardRepositoryPort,
    private readonly getDashboardOverviewUseCase: GetDashboardOverviewUseCase,
    private readonly generateHybridIaNarrativeUseCase: GenerateHybridIaNarrativeUseCase,
    @Inject(IA_SUMMARY_BATCH_CACHE_PORT)
    private readonly iaSummaryBatchCachePort: IaSummaryBatchCachePort,
    private readonly configService: ConfigService<EnvVariables, true>,
  ) {}

  async execute(): Promise<void> {
    if (!this.configService.get('IA_WEEKLY_BATCH_ENABLED', { infer: true })) {
      return;
    }

    const timeZone = this.configService.get('TIMEZONE', { infer: true });
    const weekPeriod = resolveCurrentWeekPeriod(timeZone);
    const overview = await this.getDashboardOverviewUseCase.execute({});
    const filterCombos: DashboardQueryFilter[] = [
      {},
      ...overview.filterOptions.companies.map((company) => ({
        companyId: company.value,
      })),
    ];

    const cacheTtlSeconds = this.configService.get(
      'IA_SUMMARY_CACHE_TTL_SECONDS',
      { infer: true },
    );

    for (const filter of filterCombos) {
      await this.prewarmFilter({
        filter,
        weekPeriod,
        cacheTtlSeconds,
      });
    }
  }

  private async prewarmFilter(input: {
    readonly filter: DashboardQueryFilter;
    readonly weekPeriod: { readonly from: string; readonly to: string };
    readonly cacheTtlSeconds: number;
  }): Promise<void> {
    const resolvedIaQuery = resolveDashboardIaQueryFilter({
      filter: input.filter,
      viewerRoleName: ROLE_ADMINISTRATOR,
    });

    const batchKey = buildIaSummaryBatchCacheKey({
      periodFrom: input.weekPeriod.from,
      periodTo: input.weekPeriod.to,
      filter: resolvedIaQuery.filter,
    });

    const iaContext = await this.dashboardRepository.getIaContext({
      filter: resolvedIaQuery.filter,
      analysisScope: resolvedIaQuery.analysisScope,
      analysisScopeLabel: resolvedIaQuery.analysisScopeLabel,
    });

    const narrative = await this.generateHybridIaNarrativeUseCase.execute({
      context: iaContext,
    });

    await this.iaSummaryBatchCachePort.set(
      batchKey,
      {
        metricsFingerprint: buildDashboardMetricsFingerprint(iaContext),
        narrative,
      },
      input.cacheTtlSeconds,
    );

    this.logger.log(
      JSON.stringify({
        event: 'ia_weekly_batch_prewarm',
        batchKey,
        analysisScope: iaContext.analysisScope,
      }),
    );
  }
}
