import type { IaSummaryBatchEntry } from './hybrid-ia-narrative.interface';

export const IA_SUMMARY_BATCH_CACHE_PORT = Symbol(
  'IA_SUMMARY_BATCH_CACHE_PORT',
);

export interface IaSummaryBatchCachePort {
  get(batchKey: string): Promise<IaSummaryBatchEntry | null>;
  set(
    batchKey: string,
    entry: IaSummaryBatchEntry,
    ttlSeconds: number,
  ): Promise<void>;
}
