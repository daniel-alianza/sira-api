import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvVariables } from '../../config/env-validation';
import type {
  IaSummaryRateLimitPort,
  IaSummaryRateLimitResult,
} from '../application/interfaces/ia-summary-rate-limit.port';

interface IaSummaryRateLimitEntry {
  count: number;
  windowStartedAt: number;
}

@Injectable()
export class InMemoryIaSummaryRateLimitAdapter implements IaSummaryRateLimitPort {
  private readonly maxRequests: number;
  private readonly windowSeconds: number;
  private readonly entries = new Map<string, IaSummaryRateLimitEntry>();

  constructor(configService: ConfigService<EnvVariables, true>) {
    this.maxRequests = configService.get('IA_SUMMARY_RATE_LIMIT_MAX', {
      infer: true,
    });
    this.windowSeconds = configService.get(
      'IA_SUMMARY_RATE_LIMIT_WINDOW_SECONDS',
      { infer: true },
    );
  }

  async consume(userId: string): Promise<IaSummaryRateLimitResult> {
    const now = Date.now();
    const currentEntry = this.entries.get(userId);
    const windowMs = this.windowSeconds * 1000;

    if (!currentEntry || now - currentEntry.windowStartedAt >= windowMs) {
      this.entries.set(userId, { count: 1, windowStartedAt: now });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (currentEntry.count >= this.maxRequests) {
      const retryAfterSeconds = Math.ceil(
        (currentEntry.windowStartedAt + windowMs - now) / 1000,
      );

      return {
        allowed: false,
        retryAfterSeconds: Math.max(retryAfterSeconds, 1),
      };
    }

    currentEntry.count += 1;
    this.entries.set(userId, currentEntry);

    return { allowed: true, retryAfterSeconds: 0 };
  }
}
