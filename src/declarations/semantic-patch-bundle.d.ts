import type {
  EvidenceRecord,
  FrontierSourceLanguage,
  SemanticMergeReadiness,
  SemanticPatchBundle,
  SourceMapMappingRecord,
  SourceSpan
} from '@shapeshift-labs/frontier-lang-kernel';
import type { NativeSourceChangeKind, NativeSourceChangeSet } from './native-diff.js';
import type { SemanticEditProjection, SemanticEditScript } from './semantic-edit-script.js';
import type { SemanticTransformIdentityRecord } from './semantic-transform-identity.js';

export type SemanticPatchBundleAdmissionStatus = 'proposed' | 'queued' | 'admitted' | 'needs-review' | 'blocked' | 'rejected' | string;

export interface SemanticPatchBundleSourceRef {
  readonly id?: string;
  readonly side?: 'before' | 'after' | string;
  readonly importId?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly baseHash?: string;
  readonly targetHash?: string;
  readonly nativeSourceId?: string;
  readonly nativeAstId?: string;
  readonly semanticIndexId?: string;
  readonly universalAstId?: string;
  readonly sourceMapIds?: readonly string[];
  readonly ordinal?: number;
}

export interface SemanticPatchBundleChangedRegion {
  readonly id?: string;
  readonly key?: string;
  readonly conflictKey?: string;
  readonly changeKind?: NativeSourceChangeKind | string;
  readonly regionKind?: string;
  readonly granularity?: string;
  readonly precision?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly symbolKind?: string;
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

export interface SemanticPatchBundleSourceMapLink {
  readonly id: string;
  readonly side?: 'before' | 'after' | string;
  readonly sourceMapId?: string;
  readonly sourceMapMappingId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly targetPath?: string;
  readonly targetHash?: string;
  readonly semanticSymbolId?: string;
  readonly semanticOccurrenceId?: string;
  readonly semanticNodeId?: string;
  readonly nativeSourceId?: string;
  readonly nativeAstNodeId?: string;
  readonly precision?: string;
  readonly sourceSpan?: SourceSpan;
  readonly generatedSpan?: SourceMapMappingRecord['generatedSpan'];
  readonly regionKey?: string;
  readonly regionKind?: string;
}

export interface SemanticPatchBundleAdmission {
  readonly status: SemanticPatchBundleAdmissionStatus;
  readonly readiness: SemanticMergeReadiness | string;
  readonly reviewRequired: boolean;
  readonly autoMergeClaim: false;
  readonly reasonCodes?: readonly string[];
  readonly conflictKeys?: readonly string[];
  readonly admittedAt?: number | string;
  readonly reviewerId?: string;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticPatchBundleRecordIndex {
  readonly baseHashes: readonly string[];
  readonly targetHashes: readonly string[];
  readonly sourceHashes: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly regionKeys: readonly string[];
  readonly regionKinds: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly sourceMapIds: readonly string[];
  readonly sourceMapMappingIds: readonly string[];
  readonly sourceMapLinkIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly proofIds: readonly string[];
  readonly historyIds: readonly string[];
  readonly semanticOperationIds: readonly string[];
  readonly semanticEditScriptIds: readonly string[];
  readonly semanticEditProjectionIds: readonly string[];
  readonly semanticEditKeys: readonly string[];
  readonly semanticIdentityHashes: readonly string[];
  readonly sourceIdentityHashes: readonly string[];
  readonly operationContentHashes: readonly string[];
  readonly editContentHashes: readonly string[];
  readonly semanticTransformIds: readonly string[];
  readonly semanticTransformKeys: readonly string[];
  readonly semanticTransformIdentityHashes: readonly string[];
  readonly semanticTransformContentHashes: readonly string[];
  readonly projectionIdentityHashes: readonly string[];
  readonly transformSourceLanguages: readonly string[];
  readonly transformTargetLanguages: readonly string[];
  readonly transformSourcePaths: readonly string[];
  readonly transformTargetPaths: readonly string[];
  readonly patchIds: readonly string[];
  readonly mergeCandidateIds: readonly string[];
  readonly readinesses: readonly string[];
  readonly admissionStatuses: readonly string[];
}

export interface SemanticPatchBundleRecord {
  readonly kind: 'frontier.lang.semanticPatchBundleRecord';
  readonly version: 1;
  readonly schema: 'frontier.lang.semanticPatchBundleRecord.v1';
  readonly id: string;
  readonly createdAt?: number | string;
  readonly patchId?: string;
  readonly mergeCandidateId?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly baseHash?: string;
  readonly targetHash?: string;
  readonly sources: readonly SemanticPatchBundleSourceRef[];
  readonly changedRegions: readonly SemanticPatchBundleChangedRegion[];
  readonly sourceMapLinks: readonly SemanticPatchBundleSourceMapLink[];
  readonly evidenceIds: readonly string[];
  readonly proofIds: readonly string[];
  readonly historyIds: readonly string[];
  readonly semanticOperationIds: readonly string[];
  readonly semanticEditScriptIds: readonly string[];
  readonly semanticEditProjectionIds: readonly string[];
  readonly semanticTransformIdentityIds: readonly string[];
  readonly admission: SemanticPatchBundleAdmission;
  readonly index: SemanticPatchBundleRecordIndex;
  readonly summary: {
    readonly changedRegions: number;
    readonly sourceMapLinks: number;
    readonly evidenceIds: number;
    readonly proofIds: number;
    readonly historyIds: number;
    readonly semanticOperations: number;
    readonly semanticEditScripts: number;
    readonly semanticEditProjections: number;
    readonly semanticEditProjectionEdits: number;
    readonly semanticTransformIdentities: number;
    readonly reviewRequired: boolean;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface CreateSemanticPatchBundleRecordOptions {
  readonly id?: string;
  readonly createdAt?: number | string;
  readonly patch?: SemanticPatchBundle;
  readonly patchId?: string;
  readonly mergeCandidate?: unknown;
  readonly mergeCandidateId?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly baseHash?: string;
  readonly targetHash?: string;
  readonly readiness?: SemanticMergeReadiness | string;
  readonly sources?: readonly SemanticPatchBundleSourceRef[] | SemanticPatchBundleSourceRef;
  readonly changedRegions?: readonly unknown[] | unknown;
  readonly sourceMapLinks?: readonly SemanticPatchBundleSourceMapLink[] | SemanticPatchBundleSourceMapLink;
  readonly evidence?: readonly EvidenceRecord[] | EvidenceRecord;
  readonly evidenceIds?: readonly string[] | string;
  readonly proofIds?: readonly string[] | string;
  readonly historyId?: string;
  readonly historyIds?: readonly string[] | string;
  readonly semanticOperationId?: string;
  readonly semanticOperationIds?: readonly string[] | string;
  readonly semanticEditScript?: SemanticEditScript;
  readonly semanticEditScripts?: readonly SemanticEditScript[] | SemanticEditScript;
  readonly semanticEditProjection?: SemanticEditProjection;
  readonly semanticEditProjections?: readonly SemanticEditProjection[] | SemanticEditProjection;
  readonly semanticTransformIdentity?: SemanticTransformIdentityRecord | Record<string, unknown>;
  readonly semanticTransformIdentities?: readonly (SemanticTransformIdentityRecord | Record<string, unknown>)[];
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly targetLanguage?: FrontierSourceLanguage | string;
  readonly conflictKeys?: readonly string[] | string;
  readonly admission?: Partial<SemanticPatchBundleAdmission>;
  readonly metadata?: Record<string, unknown>;
}

export type CreateSemanticPatchBundleRecordInput = NativeSourceChangeSet | Partial<SemanticPatchBundleRecord> | Record<string, unknown>;

export interface SemanticPatchBundleRecordQuery {
  readonly id?: string | readonly string[];
  readonly ids?: readonly string[];
  readonly patchId?: string | readonly string[];
  readonly patchIds?: readonly string[];
  readonly mergeCandidateId?: string | readonly string[];
  readonly mergeCandidateIds?: readonly string[];
  readonly sourcePath?: string | readonly string[];
  readonly sourcePaths?: readonly string[];
  readonly sourceHash?: string | readonly string[];
  readonly sourceHashes?: readonly string[];
  readonly baseHash?: string | readonly string[];
  readonly baseHashes?: readonly string[];
  readonly targetHash?: string | readonly string[];
  readonly targetHashes?: readonly string[];
  readonly regionKey?: string | readonly string[];
  readonly regionKeys?: readonly string[];
  readonly regionKind?: string | readonly string[];
  readonly regionKinds?: readonly string[];
  readonly conflictKey?: string | readonly string[];
  readonly conflictKeys?: readonly string[];
  readonly sourceMapId?: string | readonly string[];
  readonly sourceMapIds?: readonly string[];
  readonly sourceMapMappingId?: string | readonly string[];
  readonly sourceMapMappingIds?: readonly string[];
  readonly sourceMapLinkId?: string | readonly string[];
  readonly sourceMapLinkIds?: readonly string[];
  readonly evidenceId?: string | readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly proofId?: string | readonly string[];
  readonly proofIds?: readonly string[];
  readonly historyId?: string | readonly string[];
  readonly historyIds?: readonly string[];
  readonly semanticOperationId?: string | readonly string[];
  readonly semanticOperationIds?: readonly string[];
  readonly semanticEditScriptId?: string | readonly string[];
  readonly semanticEditScriptIds?: readonly string[];
  readonly semanticEditProjectionId?: string | readonly string[];
  readonly semanticEditProjectionIds?: readonly string[];
  readonly semanticEditKey?: string | readonly string[];
  readonly semanticEditKeys?: readonly string[];
  readonly semanticIdentityHash?: string | readonly string[];
  readonly semanticIdentityHashes?: readonly string[];
  readonly sourceIdentityHash?: string | readonly string[];
  readonly sourceIdentityHashes?: readonly string[];
  readonly operationContentHash?: string | readonly string[];
  readonly operationContentHashes?: readonly string[];
  readonly editContentHash?: string | readonly string[];
  readonly editContentHashes?: readonly string[];
  readonly semanticTransformId?: string | readonly string[];
  readonly semanticTransformIds?: readonly string[];
  readonly semanticTransformKey?: string | readonly string[];
  readonly semanticTransformKeys?: readonly string[];
  readonly semanticTransformIdentityHash?: string | readonly string[];
  readonly semanticTransformIdentityHashes?: readonly string[];
  readonly semanticTransformContentHash?: string | readonly string[];
  readonly semanticTransformContentHashes?: readonly string[];
  readonly projectionIdentityHash?: string | readonly string[];
  readonly projectionIdentityHashes?: readonly string[];
  readonly transformSourceLanguage?: string | readonly string[];
  readonly transformSourceLanguages?: readonly string[];
  readonly transformTargetLanguage?: string | readonly string[];
  readonly transformTargetLanguages?: readonly string[];
  readonly transformSourcePath?: string | readonly string[];
  readonly transformSourcePaths?: readonly string[];
  readonly transformTargetPath?: string | readonly string[];
  readonly transformTargetPaths?: readonly string[];
  readonly readiness?: SemanticMergeReadiness | string | readonly string[];
  readonly readinesses?: readonly string[];
  readonly admissionStatus?: SemanticPatchBundleAdmissionStatus | readonly string[];
  readonly admissionStatuses?: readonly string[];
}

export declare const SemanticPatchBundleAdmissionStatuses: readonly SemanticPatchBundleAdmissionStatus[];
export declare function createSemanticPatchBundleRecord(input?: CreateSemanticPatchBundleRecordInput, options?: CreateSemanticPatchBundleRecordOptions): SemanticPatchBundleRecord;
export declare function querySemanticPatchBundleRecords(records: SemanticPatchBundleRecord | readonly SemanticPatchBundleRecord[], query?: SemanticPatchBundleRecordQuery): readonly SemanticPatchBundleRecord[];
