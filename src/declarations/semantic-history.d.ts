import type {
  EvidenceRecord,
  FrontierSourceLanguage,
  SemanticMergeCandidateRecord,
  SemanticMergeReadiness,
  SourceSpan
} from '@shapeshift-labs/frontier-lang-kernel';
import type { SemanticImportOwnershipRegion } from './semantic-sidecar.js';

export type SemanticHistoryAdmissionStatus = 'proposed' | 'queued' | 'admitted' | 'needs-review' | 'blocked' | 'rejected' | string;
export type SemanticHistoryReviewerStatus = 'unreviewed' | 'approved' | 'changes-requested' | 'reviewed' | 'rejected' | string;
export type SemanticHistoryReplayLinkKind = 'patch' | 'slice' | 'sidecar' | 'run' | 'proof' | 'source' | 'command' | 'url' | 'replay' | string;
export type SemanticHistoryOverlapKind = 'ownership' | 'conflict-key' | 'source' | 'source-path' | 'import' | 'semantic-candidate' | 'evidence' | 'proof' | 'replay' | 'base-hash' | 'target-hash';
export type SemanticHistoryConflictReason = 'ownership-overlap' | 'semantic-conflict-key-overlap' | 'base-hash-mismatch' | 'target-hash-mismatch' | 'admission-blocked' | 'reviewer-rejected' | 'source-path-overlap' | string;

export interface SemanticHistorySourceRef {
  readonly id?: string;
  readonly importId?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly baseHash?: string;
  readonly targetHash?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticHistoryOwnershipRegionRef {
  readonly id?: string;
  readonly key: string;
  readonly regionKind?: string;
  readonly granularity?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly sourceSpan?: SourceSpan;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticHistoryCandidateRef {
  readonly id: string;
  readonly importResultId?: string;
  readonly patchId?: string;
  readonly sourcePath?: string;
  readonly baseHash?: string;
  readonly targetHash?: string;
  readonly readiness?: SemanticMergeReadiness | string;
  readonly conflictKeys: readonly string[];
  readonly ownershipKeys: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly proofIds: readonly string[];
  readonly replayIds: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticHistoryReviewerState {
  readonly status: SemanticHistoryReviewerStatus;
  readonly reviewerId?: string;
  readonly reviewedAt?: number | string;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticHistoryAdmissionState {
  readonly status: SemanticHistoryAdmissionStatus;
  readonly readiness: SemanticMergeReadiness | string;
  readonly admittedAt?: number | string;
  readonly reviewerId?: string;
  readonly reasonCodes?: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticHistoryReplayLink {
  readonly id: string;
  readonly kind: SemanticHistoryReplayLinkKind;
  readonly href?: string;
  readonly path?: string;
  readonly command?: string;
  readonly hash?: string;
  readonly targetId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticHistoryRecordIndex {
  readonly baseHashes: readonly string[];
  readonly targetHashes: readonly string[];
  readonly sourceIds: readonly string[];
  readonly importIds: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly sourceHashes: readonly string[];
  readonly ownershipKeys: readonly string[];
  readonly semanticCandidateIds: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly proofIds: readonly string[];
  readonly replayIds: readonly string[];
}

export interface SemanticHistoryRecord {
  readonly kind: 'frontier.lang.semanticHistoryRecord';
  readonly version: 1;
  readonly id: string;
  readonly createdAt: number | string;
  readonly baseHash?: string;
  readonly targetHash?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceIds: readonly string[];
  readonly importIds: readonly string[];
  readonly sources: readonly SemanticHistorySourceRef[];
  readonly ownershipRegions: readonly SemanticHistoryOwnershipRegionRef[];
  readonly semanticCandidates: readonly SemanticHistoryCandidateRef[];
  readonly evidenceIds: readonly string[];
  readonly proofIds: readonly string[];
  readonly reviewer: SemanticHistoryReviewerState;
  readonly admission: SemanticHistoryAdmissionState;
  readonly replayLinks: readonly SemanticHistoryReplayLink[];
  readonly index: SemanticHistoryRecordIndex;
  readonly metadata?: Record<string, unknown>;
}

export interface CreateSemanticHistoryRecordInput {
  readonly id?: string;
  readonly createdAt?: number | string;
  readonly baseHash?: string;
  readonly targetHash?: string;
  readonly beforeHash?: string;
  readonly afterHash?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceId?: string;
  readonly sourceIds?: readonly string[] | string;
  readonly importId?: string;
  readonly importIds?: readonly string[] | string;
  readonly importResultId?: string;
  readonly sources?: readonly SemanticHistorySourceRef[] | SemanticHistorySourceRef;
  readonly sourceRefs?: readonly SemanticHistorySourceRef[] | SemanticHistorySourceRef;
  readonly ownershipRegions?: readonly (SemanticHistoryOwnershipRegionRef | SemanticImportOwnershipRegion)[] | SemanticHistoryOwnershipRegionRef | SemanticImportOwnershipRegion;
  readonly semanticCandidates?: readonly (Partial<SemanticHistoryCandidateRef> | SemanticMergeCandidateRecord)[] | Partial<SemanticHistoryCandidateRef> | SemanticMergeCandidateRecord;
  readonly mergeCandidates?: readonly SemanticMergeCandidateRecord[] | SemanticMergeCandidateRecord;
  readonly evidence?: readonly EvidenceRecord[];
  readonly evidenceIds?: readonly string[] | string;
  readonly proofIds?: readonly string[] | string;
  readonly reviewer?: SemanticHistoryReviewerState | SemanticHistoryReviewerStatus;
  readonly admission?: Partial<SemanticHistoryAdmissionState>;
  readonly replayLinks?: readonly (SemanticHistoryReplayLink | string)[] | SemanticHistoryReplayLink | string;
  readonly replay?: readonly (SemanticHistoryReplayLink | string)[] | SemanticHistoryReplayLink | string;
  readonly importResult?: unknown;
  readonly imported?: unknown;
  readonly changeSet?: unknown;
  readonly changedRegions?: readonly unknown[];
  readonly mergeCandidate?: unknown;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticHistoryOverlapQueryOptions {
  readonly includeSourcePaths?: boolean;
  readonly includeEvidence?: boolean;
  readonly includeProofs?: boolean;
  readonly includeReplay?: boolean;
  readonly includeBaseHashes?: boolean;
  readonly includeTargetHashes?: boolean;
  readonly conflictOnSourcePath?: boolean;
}

export interface SemanticHistoryOverlapRecord {
  readonly schema: 'frontier.lang.semanticHistoryOverlap.v1';
  readonly leftId: string;
  readonly rightId: string;
  readonly overlap: Partial<Record<SemanticHistoryOverlapKind, readonly string[]>>;
  readonly overlapKinds: readonly SemanticHistoryOverlapKind[];
  readonly conflict: boolean;
  readonly conflictReasons: readonly SemanticHistoryConflictReason[];
  readonly admission: { readonly left?: SemanticHistoryAdmissionStatus; readonly right?: SemanticHistoryAdmissionStatus };
  readonly reviewer: { readonly left?: SemanticHistoryReviewerStatus; readonly right?: SemanticHistoryReviewerStatus };
}

export declare const SemanticHistoryAdmissionStatuses: readonly SemanticHistoryAdmissionStatus[];
export declare const SemanticHistoryReviewerStatuses: readonly SemanticHistoryReviewerStatus[];
export declare const SemanticHistoryOverlapKinds: readonly SemanticHistoryOverlapKind[];
export declare const SemanticHistoryConflictReasons: readonly SemanticHistoryConflictReason[];
export declare function createSemanticHistoryRecord(input?: CreateSemanticHistoryRecordInput, options?: { readonly id?: string; readonly createdAt?: number | string }): SemanticHistoryRecord;
export declare function querySemanticHistoryRecordOverlaps(records: SemanticHistoryRecord | readonly SemanticHistoryRecord[], options?: SemanticHistoryOverlapQueryOptions): readonly SemanticHistoryOverlapRecord[];
export declare function semanticHistoryRecordsOverlap(left: SemanticHistoryRecord, right: SemanticHistoryRecord, options?: SemanticHistoryOverlapQueryOptions): boolean;
export declare function semanticHistoryRecordsConflict(left: SemanticHistoryRecord, right: SemanticHistoryRecord, options?: SemanticHistoryOverlapQueryOptions): boolean;
