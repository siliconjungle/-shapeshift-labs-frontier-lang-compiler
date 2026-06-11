import type { FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';

export interface SemanticTransformIdentityRecord {
  readonly kind: 'frontier.lang.semanticTransformIdentityRecord';
  readonly version: 1;
  readonly schema: 'frontier.lang.semanticTransformIdentityRecord.v1';
  readonly id: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly targetLanguage?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly targetPath?: string;
  readonly baseHash?: string;
  readonly targetHash?: string;
  readonly semanticKey?: string;
  readonly transformKey?: string;
  readonly semanticIdentityHash?: string;
  readonly sourceIdentityHash?: string;
  readonly operationContentHash?: string;
  readonly editContentHash?: string;
  readonly transformIdentityHash?: string;
  readonly projectionIdentityHash?: string;
  readonly transformContentHash?: string;
  readonly readiness?: string;
  readonly confidence?: number;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: {
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly sourceTransformId?: string;
    readonly [key: string]: unknown;
  };
}

export interface CreateSemanticTransformIdentityRecordOptions extends Partial<SemanticTransformIdentityRecord> {
  readonly language?: FrontierSourceLanguage | string;
  readonly projectedLanguage?: FrontierSourceLanguage | string;
  readonly originalSourcePath?: string;
  readonly targetSourcePath?: string;
  readonly projectedSourcePath?: string;
  readonly symbolName?: string;
  readonly symbolKind?: string;
  readonly anchorKey?: string;
  readonly regionId?: string;
  readonly operationId?: string;
}

export interface DeriveSemanticTransformIdentityRecordsOptions extends CreateSemanticTransformIdentityRecordOptions {
  readonly semanticEditProjection?: unknown;
  readonly semanticEditProjections?: readonly unknown[] | unknown;
  readonly projection?: unknown;
  readonly projections?: readonly unknown[] | unknown;
}

export type CreateSemanticTransformIdentityRecordInput =
  | Partial<SemanticTransformIdentityRecord>
  | Record<string, unknown>;

export declare function createSemanticTransformIdentityRecord(
  input?: CreateSemanticTransformIdentityRecordInput,
  options?: CreateSemanticTransformIdentityRecordOptions
): SemanticTransformIdentityRecord;
export declare function semanticTransformIdentityFields(
  record?: SemanticTransformIdentityRecord | Record<string, unknown>
): SemanticTransformIdentityRecord;
export declare function deriveSemanticTransformIdentityRecords(
  input?: DeriveSemanticTransformIdentityRecordsOptions | Record<string, unknown>,
  options?: DeriveSemanticTransformIdentityRecordsOptions
): readonly SemanticTransformIdentityRecord[];
