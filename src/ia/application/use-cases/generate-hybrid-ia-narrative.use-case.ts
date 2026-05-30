import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvVariables } from '../../../config/env-validation';
import type { DashboardIaContext } from '../../../dashboard/application/interfaces/dashboard.interface';
import {
  buildFallbackHybridNarrative,
  shouldUseFallbackHybridNarrative,
} from '../helpers/build-fallback-hybrid-narrative.helper';
import { parseHybridIaNarrative } from '../helpers/parse-hybrid-ia-narrative.helper';
import type { HybridIaNarrative } from '../interfaces/hybrid-ia-narrative.interface';
import {
  IA_COMPLETION_PORT,
  type IaCompletionPort,
} from '../interfaces/ia-completion.port';
import {
  buildHybridIaUserMessage,
  DASHBOARD_AI_HYBRID_SYSTEM_PROMPT,
} from '../../utils/hybrid-prompt';

export interface GenerateHybridIaNarrativeInput {
  readonly context: DashboardIaContext;
}

@Injectable()
export class GenerateHybridIaNarrativeUseCase {
  constructor(
    @Inject(IA_COMPLETION_PORT)
    private readonly iaCompletionPort: IaCompletionPort,
    private readonly configService: ConfigService<EnvVariables, true>,
  ) {}

  async execute(input: GenerateHybridIaNarrativeInput): Promise<HybridIaNarrative> {
    if (shouldUseFallbackHybridNarrative(input.context)) {
      return buildFallbackHybridNarrative(input.context);
    }

    const rawResponse = await this.iaCompletionPort.generateDashboardSummaryJson({
      systemPrompt: DASHBOARD_AI_HYBRID_SYSTEM_PROMPT,
      userMessage: buildHybridIaUserMessage({ context: input.context }),
      maxTokens: this.configService.get('IA_HYBRID_MAX_TOKENS', { infer: true }),
    });

    try {
      return parseHybridIaNarrative(rawResponse);
    } catch {
      throw new BadRequestException(
        'La IA devolvió un formato inválido para la narrativa híbrida.',
      );
    }
  }
}
