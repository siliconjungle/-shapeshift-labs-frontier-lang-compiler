import type {
  EvidenceRecord,
  FrontierSourceLanguage,
  SemanticMergeCandidateRecord,
  SemanticMergeReadiness,
  SourceSpan
} from '@shapeshift-labs/frontier-lang-kernel';
import type { NativeSourceChangeKind, NativeSourceChangeSet } from './native-diff.js';
import type { SemanticMergeConflictSummary } from './semantic-merge-conflicts.js';

export type SemanticMergeCandidateProjectionRisk = 'low' | 'medium' | 'high' | 'unknown';

export interface SemanticMergeCandidateChangedRegion {
  readonly id?: string;
  readonly key?: string;
  readonly conflictKey?: string;
  readonly changeKind?: NativeSourceChangeKind | string;
  readonly regionKind?: string;
  readonly granularity?: string;
  readonly precision?: string;
  readonly projectionRisk?: SemanticMergeCandidateProjectionRisk;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly baseHash?: string;
  readonly targetHash?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly symbolKind?: string;
  readonly semanticNodeId?: string;
  readonly nativeAstNodeId?: string;
  readonly sourceSpan?: SourceSpan;
  readonly sourceMapLinkIds?: readonly string[];
  readonly sourceMapIds?: readonly string[];
  readonly sourceMapMappingIds?: readonly string[];
  readonly admission?: {
    readonly readiness?: SemanticMergeReadiness | string;
    readonly action?: string;
    readonly reasonCodes?: readonly string[];
    readonly conflictKeys?: readonly string[];
  };
}

export interface SemanticMergeCandidateOverlapRecord {
  readonly schema: 'frontier.lang.semanticMergeCandidateOverlap.v1';
  readonly id: string;
  readonly overlapKind: 'conflict-key' | 'region-key' | 'source-span' | string;
  readonly risk: 'medium' | 'high' | string;
  readonly readiness: SemanticMergeReadiness | string;
  readonly recordIds: readonly string[];
  readonly candidateIds: readonly string[];
  readonly regionIds: readonly string[];
  readonly regionKeys: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly sourcePath?: string;
  readonly leftRegion: Partial<SemanticMergeCandidateChangedRegion>;
  readonly rightRegion: Partial<SemanticMergeCandidateChangedRegion>;
}

export interface SemanticMergeCandidateAdmissionRecord {
  readonly kind: 'frontier.lang.semanticMergeCandidateAdmissionRecord';
  readonly version: 1;
  readonly schema: 'frontier.lang.semanticMergeCandidateAdmissionRecord.v1';
  readonly id: string;
  readonly candidateId?: string;
  readonly importResultId?: string;
  readonly patchId?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly readiness: SemanticMergeReadiness | string;
  readonly readinessSortKey: number;
  readonly projectionRisk: SemanticMergeCandidateProjectionRisk;
  readonly sourceHashes: {
    readonly baseHash?: string;
    readonly targetHash?: string;
    readonly values: readonly string[];
  };
  readonly baseHash?: string;
  readonly targetHash?: string;
  readonly changedSemanticRegions: readonly SemanticMergeCandidateChangedRegion[];
  readonly conflictKeys: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly proofIds: readonly string[];
  readonly overlapSummary: {
    readonly total: number;
    readonly hasOverlaps: boolean;
    readonly byKind: Readonly<Record<string, number>>;
    readonly conflictKeys: readonly string[];
    readonly pairs: readonly SemanticMergeCandidateOverlapRecord[];
  };
  readonly admission: {
    readonly readiness: SemanticMergeReadiness | string;
    readonly reviewRequired: boolean;
    readonly action: 'admit' | 'prioritize-review' | 'block' | string;
    readonly sortKey: number;
    readonly reasonCodes: readonly string[];
    readonly conflictKeys: readonly string[];
  };
  readonly index: {
    readonly candidateIds: readonly string[];
    readonly importResultIds: readonly string[];
    readonly patchIds: readonly string[];
    readonly sourcePaths: readonly string[];
    readonly sourceHashes: readonly string[];
    readonly baseHashes: readonly string[];
    readonly targetHashes: readonly string[];
    readonly regionIds: readonly string[];
    readonly regionKeys: readonly string[];
    readonly regionKinds: readonly string[];
    readonly conflictKeys: readonly string[];
    readonly evidenceIds: readonly string[];
    readonly proofIds: readonly string[];
    readonly readinesses: readonly string[];
    readonly projectionRisks: readonly string[];
  };
  readonly summary: {
    readonly changedSemanticRegions: number;
    readonly conflictKeys: number;
    readonly evidenceIds: number;
    readonly proofIds: number;
    readonly overlaps: number;
    readonly readiness: SemanticMergeReadiness | string;
    readonly projectionRisk: SemanticMergeCandidateProjectionRisk;
    readonly reviewRequired: boolean;
  };
  readonly metadata?: Record<string, unknown> & {
    readonly conflictSummary?: SemanticMergeConflictSummary;
  };
}

export type SemanticMergeCandidateAdmissionInput =
  | NativeSourceChangeSet
  | SemanticMergeCandidateRecord
  | SemanticMergeCandidateAdmissionRecord
  | Record<string, unknown>;

export interface CreateSemanticMergeCandidateAdmissionRecordOptions {
  readonly id?: string;
  readonly changeSet?: NativeSourceChangeSet;
  readonly candidate?: SemanticMergeCandidateRecord | Record<string, unknown>;
  readonly patch?: unknown;
  readonly candidateId?: string;
  readonly importResultId?: string;
  readonly patchId?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceHashes?: readonly string[] | string;
  readonly baseHash?: string;
  readonly targetHash?: string;
  readonly readiness?: SemanticMergeReadiness | string;
  readonly projectionRisk?: SemanticMergeCandidateProjectionRisk | string;
  readonly changedRegions?: readonly unknown[] | unknown;
  readonly conflictKeys?: readonly string[] | string;
  readonly evidence?: readonly EvidenceRecord[] | EvidenceRecord;
  readonly evidenceIds?: readonly string[] | string;
  readonly proofIds?: readonly string[] | string;
  readonly reasonCodes?: readonly string[] | string;
  readonly metadata?: Record<string, unknown>;
}

export type SemanticMergeCandidateWithAdmission = SemanticMergeCandidateRecord & {
  readonly changedSemanticRegions?: readonly SemanticMergeCandidateChangedRegion[];
  readonly sourceHashes?: SemanticMergeCandidateAdmissionRecord['sourceHashes'];
  readonly evidenceIds?: readonly string[];
  readonly proofIds?: readonly string[];
  readonly projectionRisk?: SemanticMergeCandidateProjectionRisk;
  readonly readinessSortKey?: number;
  readonly mergeAdmission?: SemanticMergeCandidateAdmissionRecord;
};

export interface SemanticMergeCandidateAdmissionOverlapQuery {
  readonly id?: string | readonly string[];
  readonly ids?: readonly string[];
  readonly candidateId?: string | readonly string[];
  readonly candidateIds?: readonly string[];
  readonly recordId?: string | readonly string[];
  readonly recordIds?: readonly string[];
  readonly regionId?: string | readonly string[];
  readonly regionIds?: readonly string[];
  readonly regionKey?: string | readonly string[];
  readonly regionKeys?: readonly string[];
  readonly conflictKey?: string | readonly string[];
  readonly conflictKeys?: readonly string[];
  readonly sourcePath?: string | readonly string[];
  readonly sourcePaths?: readonly string[];
  readonly overlapKind?: string | readonly string[];
  readonly overlapKinds?: readonly string[];
  readonly readiness?: SemanticMergeReadiness | string | readonly string[];
  readonly readinesses?: readonly string[];
  readonly risk?: string | readonly string[];
  readonly risks?: readonly string[];
}

export declare const SemanticMergeCandidateProjectionRisks: readonly SemanticMergeCandidateProjectionRisk[];
export declare function createSemanticMergeCandidateAdmissionRecord(input?: SemanticMergeCandidateAdmissionInput, options?: CreateSemanticMergeCandidateAdmissionRecordOptions): SemanticMergeCandidateAdmissionRecord;
export declare function decorateSemanticMergeCandidateForAdmission<T extends SemanticMergeCandidateRecord | Record<string, unknown>>(input?: T, options?: CreateSemanticMergeCandidateAdmissionRecordOptions): T & SemanticMergeCandidateWithAdmission;
export declare function querySemanticMergeCandidateAdmissionOverlaps(records: SemanticMergeCandidateAdmissionInput | readonly SemanticMergeCandidateAdmissionInput[], query?: SemanticMergeCandidateAdmissionOverlapQuery): readonly SemanticMergeCandidateOverlapRecord[];
export declare function semanticMergeCandidateReadinessSortKey(candidateOrRecord: Partial<SemanticMergeCandidateAdmissionRecord> | Partial<SemanticMergeCandidateWithAdmission>): number;
export declare function sortSemanticMergeCandidateAdmissionRecords<T extends SemanticMergeCandidateAdmissionInput>(records: readonly T[], options?: { readonly desc?: boolean }): readonly SemanticMergeCandidateAdmissionRecord[];
