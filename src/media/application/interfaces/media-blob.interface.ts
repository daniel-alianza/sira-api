export type MediaBlobKind =
  | 'DETECTION_EVIDENCE'
  | 'CORRECTIVE_SIGNATURE'
  | 'CORRECTIVE_RESOLUTION';

export interface CreateMediaBlobInput {
  readonly kind: MediaBlobKind;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly content: Buffer;
  readonly uploadedById: string;
}

export interface MediaBlobContent {
  readonly id: string;
  readonly mimeType: string;
  readonly content: Buffer;
}
