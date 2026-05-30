import { Injectable } from '@nestjs/common';
import type { IaSummaryBatchEntry } from '../application/interfaces/hybrid-ia-narrative.interface';
import type { IaSummaryBatchCachePort } from '../application/interfaces/ia-summary-batch-cache.port';

interface IaSummaryBatchCacheEntry {
  readonly entry: IaSummaryBatchEntry;
  readonly expiresAt: number;
}

@Injectable()
export class InMemoryIaSummaryBatchCacheAdapter implements IaSummaryBatchCachePort {
  private readonly entries = new Map<string, IaSummaryBatchCacheEntry>();

  async get(batchKey: string): Promise<IaSummaryBatchEntry | null> {
    this.pruneExpiredEntries();

    const cachedEntry = this.entries.get(batchKey);

    if (!cachedEntry) {
      return null;
    }

    if (cachedEntry.expiresAt <= Date.now()) {
      this.entries.delete(batchKey);
      return null;
    }

    return cachedEntry.entry;
  }

  async set(
    batchKey: string,
    entry: IaSummaryBatchEntry,
    ttlSeconds: number,
  ): Promise<void> {
    this.pruneExpiredEntries();

    this.entries.set(batchKey, {
      entry,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private pruneExpiredEntries(): void {
    const now = Date.now();

    for (const [batchKey, cachedEntry] of this.entries.entries()) {
      if (cachedEntry.expiresAt <= now) {
        this.entries.delete(batchKey);
      }
    }
  }
}
