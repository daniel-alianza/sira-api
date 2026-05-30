import { Injectable } from '@nestjs/common';
import type { DashboardAiSummary } from '../application/interfaces/dashboard-metrics.interface';
import type { IaSummaryCachePort } from '../application/interfaces/ia-summary-cache.port';

interface IaSummaryCacheEntry {
  readonly summary: DashboardAiSummary;
  readonly expiresAt: number;
}

@Injectable()
export class InMemoryIaSummaryCacheAdapter implements IaSummaryCachePort {
  private readonly entries = new Map<string, IaSummaryCacheEntry>();

  async get(cacheKey: string): Promise<DashboardAiSummary | null> {
    this.pruneExpiredEntries();

    const entry = this.entries.get(cacheKey);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(cacheKey);
      return null;
    }

    return entry.summary;
  }

  async set(
    cacheKey: string,
    summary: DashboardAiSummary,
    ttlSeconds: number,
  ): Promise<void> {
    this.pruneExpiredEntries();

    this.entries.set(cacheKey, {
      summary,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private pruneExpiredEntries(): void {
    const now = Date.now();

    for (const [cacheKey, entry] of this.entries.entries()) {
      if (entry.expiresAt <= now) {
        this.entries.delete(cacheKey);
      }
    }
  }
}
