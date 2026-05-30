import Anthropic from '@anthropic-ai/sdk';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvVariables } from '../../config/env-validation';
import type {
  IaCompletionInput,
  IaCompletionPort,
} from '../application/interfaces/ia-completion.port';

@Injectable()
export class AnthropicIaCompletionAdapter implements IaCompletionPort {
  private readonly logger = new Logger(AnthropicIaCompletionAdapter.name);
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly promptCacheEnabled: boolean;

  constructor(configService: ConfigService<EnvVariables, true>) {
    this.model = configService.get('IA_MODEL', { infer: true });
    this.maxTokens = configService.get('IA_MAX_TOKENS', { infer: true });
    this.temperature = configService.get('IA_TEMPERATURE', { infer: true });
    this.promptCacheEnabled = configService.get('IA_PROMPT_CACHE_ENABLED', {
      infer: true,
    });

    this.client = new Anthropic({
      apiKey: configService.get('ANTHROPIC_API_KEY', { infer: true }),
    });
  }

  async generateDashboardSummaryJson(
    input: IaCompletionInput,
  ): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: input.maxTokens ?? this.maxTokens,
        temperature: this.temperature,
        system: this.buildSystemPrompt(input.systemPrompt),
        messages: [
          {
            role: 'user',
            content: input.userMessage,
          },
        ],
      });

      this.logCompletionUsage(response.usage, response.stop_reason);

      if (response.stop_reason === 'max_tokens') {
        throw new BadRequestException(
          'El resumen de IA se truncó por límite de tokens. Aumenta IA_MAX_TOKENS o acorta el prompt.',
        );
      }

      const textBlock = response.content.find((block) => block.type === 'text');

      if (!textBlock || textBlock.type !== 'text') {
        throw new InternalServerErrorException(
          'La IA no devolvió contenido de texto',
        );
      }

      return textBlock.text;
    } catch (error) {
      if (
        error instanceof InternalServerErrorException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'No se pudo generar el resumen de IA. Intenta de nuevo más tarde.',
      );
    }
  }

  private buildSystemPrompt(
    systemPrompt: string,
  ): string | Anthropic.Messages.TextBlockParam[] {
    if (!this.promptCacheEnabled) {
      return systemPrompt;
    }

    return [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ];
  }

  private logCompletionUsage(
    usage: Anthropic.Messages.Usage | undefined,
    stopReason: Anthropic.Messages.Message['stop_reason'] | null,
  ): void {
    if (!usage) {
      return;
    }

    this.logger.log(
      JSON.stringify({
        event: 'ia_completion_usage',
        model: this.model,
        maxTokens: this.maxTokens,
        stopReason,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
        cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
      }),
    );
  }
}
