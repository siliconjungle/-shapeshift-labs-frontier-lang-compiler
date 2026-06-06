import type { EvidenceRecord, SemanticMergeReadiness } from '@shapeshift-labs/frontier-lang-kernel';
import type { SemanticSlice, SemanticSliceTestResult, TestSemanticSliceOptions } from './semantic-slice.js';

export type SemanticSliceAdmissionAction = 'admit' | 'prioritize' | 'reject';
export type SemanticSliceAdmissionPriority = 'low' | 'normal' | 'high' | 'blocker';
export type SemanticSliceAdmissionRisk = 'low' | 'medium' | 'high' | 'unknown';
export type SemanticSliceAdmissionScoreComponentKey =
  | 'semanticSelection'
  | 'sourceFreshness'
  | 'ownershipIsolation'
  | 'verificationEvidence'
  | 'reviewRisk';
export type SemanticSliceAdmissionScoreComponentStatus = 'strong' | 'partial' | 'weak' | 'blocked';

export interface SemanticSliceAdmissionScoreComponent {
  readonly key: SemanticSliceAdmissionScoreComponentKey;
  readonly score: number;
  readonly weight: number;
  readonly weightedScore: number;
  readonly status: SemanticSliceAdmissionScoreComponentStatus;
  readonly reasons: readonly string[];
  readonly signals: Record<string, unknown>;
}

export interface SemanticSliceAdmissionMergeScore {
  readonly schema: 'frontier.lang.semanticMergeScore.v1';
  readonly version: 1;
  readonly value: number;
  readonly uncappedValue: number;
  readonly sortKey: number;
  readonly higherIsBetter: true;
  readonly readiness: SemanticMergeReadiness;
  readonly risk: SemanticSliceAdmissionRisk;
  readonly action: SemanticSliceAdmissionAction;
  readonly components: Readonly<Record<SemanticSliceAdmissionScoreComponentKey, SemanticSliceAdmissionScoreComponent>>;
  readonly penalties: readonly string[];
}

export interface SemanticSliceAdmissionRecord {
  readonly kind: 'frontier.lang.semanticSliceAdmission';
  readonly version: 1;
  readonly id: string;
  readonly generatedAt: number;
  readonly sliceId?: string;
  readonly importId?: string;
  readonly sourcePath?: string;
  readonly action: SemanticSliceAdmissionAction;
  readonly priority: SemanticSliceAdmissionPriority;
  readonly readiness: SemanticMergeReadiness;
  readonly risk: SemanticSliceAdmissionRisk;
  readonly autoMergeClaim: false;
  readonly reviewRequired: boolean;
  readonly mergeScore: SemanticSliceAdmissionMergeScore;
  readonly counts: {
    readonly symbols: number;
    readonly ownershipRegions: number;
    readonly nativeNodes: number;
    readonly sourceMapLinks: number;
    readonly sourceFiles: number;
    readonly focusedCommands: number;
    readonly fixtureHints: number;
    readonly assertions: number;
    readonly failedAssertions: number;
    readonly warningAssertions: number;
  };
  readonly conflictKeys: readonly string[];
  readonly ownershipKeys: readonly string[];
  readonly sourceHashes: SemanticSlice['mergeAdmission']['sourceHashes'];
  readonly testResult?: SemanticSliceTestResult;
  readonly reasons: readonly string[];
  readonly metadata: Record<string, unknown>;
}

export interface CreateSemanticSliceAdmissionRecordOptions extends TestSemanticSliceOptions {
  readonly testResult?: SemanticSliceTestResult;
  readonly evidence?: readonly EvidenceRecord[];
}

export declare function createSemanticSliceAdmissionRecord(
  slice: SemanticSlice,
  options?: CreateSemanticSliceAdmissionRecordOptions
): SemanticSliceAdmissionRecord;
