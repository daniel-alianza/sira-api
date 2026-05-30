import type { DashboardAiSummary } from './dashboard-metrics.interface';

export const IA_COMPLETION_PORT = Symbol('IA_COMPLETION_PORT');

export interface IaCompletionInput {
  readonly systemPrompt: string;
  readonly userMessage: string;
  readonly maxTokens?: number;
}

export interface IaCompletionPort {
  generateDashboardSummaryJson(input: IaCompletionInput): Promise<string>;
}

export interface ParsedDashboardAiSummary
  extends Omit<DashboardAiSummary, 'generatedAt'> {}
