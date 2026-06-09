import type {
  EvidenceRecord,
  FrontierSourceLanguage,
  SemanticMergeCandidateRecord,
  SemanticMergeReadiness,
  SourceSpan
} from '@shapeshift-labs/frontier-lang-kernel';
import type { SemanticImportOwnershipRegion } from './semantic-sidecar.js';
import type { CreateSemanticLineageEventInput, SemanticLineageEvent } from './semantic-lineage.js';

import type { SemanticHistoryAdmissionStatus, SemanticHistoryReviewerStatus, SemanticHistoryReplayLinkKind, SemanticHistoryOverlapKind, SemanticHistoryConflictReason, SemanticHistoryClaimKind, SemanticHistoryClaimStatus, SemanticHistoryProofAttemptStatus, SemanticHistoryMergeDecisionStatus, SemanticHistoryActorRef, SemanticHistoryRecordSourceRef, SemanticHistorySourceRef, SemanticHistoryOwnershipRegionRef, SemanticHistoryCandidateRef, SemanticHistoryClaimRecord, SemanticHistoryImportedParserEvidenceRecord, SemanticHistoryProofAttemptRecord, SemanticHistoryPatchAncestryRecord, SemanticHistoryMergeDecisionRecord, SemanticHistoryClaimInput, SemanticHistoryImportedParserEvidenceInput, SemanticHistoryProofAttemptInput, SemanticHistoryPatchAncestryInput, SemanticHistoryMergeDecisionInput, SemanticHistoryReviewerState, SemanticHistoryAdmissionState, SemanticHistoryReplayLink, SemanticHistoryRecordIndex } from './semantic-history-records.js';
export type { SemanticHistoryAdmissionStatus, SemanticHistoryReviewerStatus, SemanticHistoryReplayLinkKind, SemanticHistoryOverlapKind, SemanticHistoryConflictReason, SemanticHistoryClaimKind, SemanticHistoryClaimStatus, SemanticHistoryProofAttemptStatus, SemanticHistoryMergeDecisionStatus, SemanticHistoryActorRef, SemanticHistoryRecordSourceRef, SemanticHistorySourceRef, SemanticHistoryOwnershipRegionRef, SemanticHistoryCandidateRef, SemanticHistoryClaimRecord, SemanticHistoryImportedParserEvidenceRecord, SemanticHistoryProofAttemptRecord, SemanticHistoryPatchAncestryRecord, SemanticHistoryMergeDecisionRecord, SemanticHistoryClaimInput, SemanticHistoryImportedParserEvidenceInput, SemanticHistoryProofAttemptInput, SemanticHistoryPatchAncestryInput, SemanticHistoryMergeDecisionInput, SemanticHistoryReviewerState, SemanticHistoryAdmissionState, SemanticHistoryReplayLink, SemanticHistoryRecordIndex } from './semantic-history-records.js';
export interface SemanticHistoryRecord {
  readonly kind: 'frontier.lang.semanticHistoryRecord';
  readonly version: 1;
  readonly id: string;
  readonly stableId: string;
  readonly hash: string;
  readonly createdAt: number | string;
  readonly baseHash?: string;
  readonly targetHash?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly actor?: SemanticHistoryActorRef;
  readonly recordSource?: SemanticHistoryRecordSourceRef;
  readonly sourceIds: readonly string[];
  readonly importIds: readonly string[];
  readonly sources: readonly SemanticHistorySourceRef[];
  readonly ownershipRegions: readonly SemanticHistoryOwnershipRegionRef[];
  readonly semanticCandidates: readonly SemanticHistoryCandidateRef[];
  readonly acceptedFacts: readonly SemanticHistoryClaimRecord[];
  readonly rejectedTheories: readonly SemanticHistoryClaimRecord[];
  readonly importedParserEvidence: readonly SemanticHistoryImportedParserEvidenceRecord[];
  readonly proofAttempts: readonly SemanticHistoryProofAttemptRecord[];
  readonly lineageEvents: readonly SemanticLineageEvent[];
  readonly patchAncestry: readonly SemanticHistoryPatchAncestryRecord[];
  readonly mergeDecisions: readonly SemanticHistoryMergeDecisionRecord[];
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
  readonly actor?: SemanticHistoryActorRef | string;
  readonly actorId?: string;
  readonly actorKind?: string;
  readonly actorRole?: string;
  readonly recordSource?: SemanticHistoryRecordSourceRef | string;
  readonly historySource?: SemanticHistoryRecordSourceRef | string;
  readonly recordSourceId?: string;
  readonly historySourceId?: string;
  readonly runId?: string;
  readonly jobId?: string;
  readonly lane?: string;
  readonly taskId?: string;
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
  readonly semanticClaims?: readonly SemanticHistoryClaimInput[] | SemanticHistoryClaimInput;
  readonly claims?: readonly SemanticHistoryClaimInput[] | SemanticHistoryClaimInput;
  readonly acceptedFacts?: readonly SemanticHistoryClaimInput[] | SemanticHistoryClaimInput;
  readonly acceptedSemanticClaims?: readonly SemanticHistoryClaimInput[] | SemanticHistoryClaimInput;
  readonly rejectedTheories?: readonly SemanticHistoryClaimInput[] | SemanticHistoryClaimInput;
  readonly rejectedSemanticClaims?: readonly SemanticHistoryClaimInput[] | SemanticHistoryClaimInput;
  readonly importedParserEvidence?: readonly SemanticHistoryImportedParserEvidenceInput[] | SemanticHistoryImportedParserEvidenceInput;
  readonly parserEvidence?: readonly SemanticHistoryImportedParserEvidenceInput[] | SemanticHistoryImportedParserEvidenceInput;
  readonly proofAttempts?: readonly SemanticHistoryProofAttemptInput[] | SemanticHistoryProofAttemptInput;
  readonly proofs?: readonly SemanticHistoryProofAttemptInput[] | SemanticHistoryProofAttemptInput;
  readonly lineageEvents?: readonly CreateSemanticLineageEventInput[] | CreateSemanticLineageEventInput;
  readonly semanticLineageEvents?: readonly CreateSemanticLineageEventInput[] | CreateSemanticLineageEventInput;
  readonly lineage?: readonly CreateSemanticLineageEventInput[] | CreateSemanticLineageEventInput;
  readonly patchAncestry?: readonly SemanticHistoryPatchAncestryInput[] | SemanticHistoryPatchAncestryInput;
  readonly patchAncestors?: readonly SemanticHistoryPatchAncestryInput[] | SemanticHistoryPatchAncestryInput;
  readonly ancestry?: readonly SemanticHistoryPatchAncestryInput[] | SemanticHistoryPatchAncestryInput;
  readonly mergeDecisions?: readonly SemanticHistoryMergeDecisionInput[] | SemanticHistoryMergeDecisionInput;
  readonly decisions?: readonly SemanticHistoryMergeDecisionInput[] | SemanticHistoryMergeDecisionInput;
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
  readonly includeClaims?: boolean;
  readonly includeLineage?: boolean;
  readonly includeCrdt?: boolean;
  readonly includeEvidence?: boolean;
  readonly includeProofs?: boolean;
  readonly includeReplay?: boolean;
  readonly includePatches?: boolean;
  readonly includeMergeDecisions?: boolean;
  readonly includeActors?: boolean;
  readonly includeRecordSources?: boolean;
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
export declare function createSemanticHistoryRecord(input?: CreateSemanticHistoryRecordInput, options?: { readonly id?: string; readonly createdAt?: number | string; readonly actor?: SemanticHistoryActorRef | string; readonly actorId?: string; readonly actorKind?: string; readonly actorRole?: string; readonly recordSource?: SemanticHistoryRecordSourceRef | string; readonly historySource?: SemanticHistoryRecordSourceRef | string; readonly recordSourceId?: string; readonly historySourceId?: string; readonly runId?: string; readonly jobId?: string; readonly lane?: string; readonly taskId?: string }): SemanticHistoryRecord;
export declare function querySemanticHistoryRecordOverlaps(records: SemanticHistoryRecord | readonly SemanticHistoryRecord[], options?: SemanticHistoryOverlapQueryOptions): readonly SemanticHistoryOverlapRecord[];
export declare function semanticHistoryRecordsOverlap(left: SemanticHistoryRecord, right: SemanticHistoryRecord, options?: SemanticHistoryOverlapQueryOptions): boolean;
export declare function semanticHistoryRecordsConflict(left: SemanticHistoryRecord, right: SemanticHistoryRecord, options?: SemanticHistoryOverlapQueryOptions): boolean;
