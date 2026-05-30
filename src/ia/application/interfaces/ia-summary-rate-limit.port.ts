export const IA_SUMMARY_RATE_LIMIT_PORT = Symbol('IA_SUMMARY_RATE_LIMIT_PORT');

export interface IaSummaryRateLimitResult {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
}

export interface IaSummaryRateLimitPort {
  consume(userId: string): Promise<IaSummaryRateLimitResult>;
}
