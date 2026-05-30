export interface HybridIaNarrative {
  readonly paragraph: string;
  readonly riskNote: string;
}

export interface IaSummaryBatchEntry {
  readonly metricsFingerprint: string;
  readonly narrative: HybridIaNarrative;
}
