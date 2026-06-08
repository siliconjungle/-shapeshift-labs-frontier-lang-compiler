import type {
  EvidenceRecord,
  FrontierSourceLanguage,
  SemanticMergeReadiness,
  SourceSpan
} from '@shapeshift-labs/frontier-lang-kernel';

export type SemanticHistoryAdmissionStatus = 'proposed' | 'queued' | 'admitted' | 'needs-review' | 'blocked' | 'rejected' | string;
export type SemanticHistoryReviewerStatus = 'unreviewed' | 'approved' | 'changes-requested' | 'reviewed' | 'rejected' | string;
export type SemanticHistoryReplayLinkKind = 'patch' | 'slice' | 'sidecar' | 'run' | 'proof' | 'source' | 'command' | 'url' | 'replay' | string;
export type SemanticHistoryOverlapKind = 'ownership' | 'conflict-key' | 'source' | 'source-path' | 'import' | 'semantic-candidate' | 'semantic-claim' | 'claim-hash' | 'evidence' | 'proof' | 'replay' | 'patch' | 'merge-decision' | 'actor' | 'record-source' | 'base-hash' | 'target-hash';
export type SemanticHistoryConflictReason = 'ownership-overlap' | 'semantic-conflict-key-overlap' | 'base-hash-mismatch' | 'target-hash-mismatch' | 'admission-blocked' | 'reviewer-rejected' | 'source-path-overlap' | string;
export type SemanticHistoryClaimKind = 'fact' | 'theory' | 'invariant' | 'semantic-claim' | string;
export type SemanticHistoryClaimStatus = 'accepted' | 'rejected' | 'proposed' | 'superseded' | string;
export type SemanticHistoryProofAttemptStatus = 'passed' | 'failed' | 'unknown' | 'blocked' | string;
export type SemanticHistoryMergeDecisionStatus = 'accepted' | 'rejected' | 'admitted' | 'blocked' | 'needs-review' | string;

export interface SemanticHistoryActorRef {
  readonly id?: string;
  readonly kind?: string;
  readonly role?: string;
  readonly displayName?: string;
  readonly runId?: string;
  readonly lane?: string;
  readonly taskId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticHistoryRecordSourceRef {
  readonly id?: string;
  readonly sourceId?: string;
  readonly sourceKind?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly href?: string;
  readonly importId?: string;
  readonly runId?: string;
  readonly jobId?: string;
  readonly lane?: string;
  readonly taskId?: string;
  readonly metadata?: Record<string, unknown>;
}

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

export interface SemanticHistoryClaimRecord {
  readonly kind: 'frontier.lang.semanticHistoryClaim';
  readonly version: 1;
  readonly id: string;
  readonly hash: string;
  readonly claimKind?: SemanticHistoryClaimKind;
  readonly status?: SemanticHistoryClaimStatus;
  readonly subject?: string;
  readonly predicate?: string;
  readonly object?: unknown;
  readonly text?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly baseHash?: string;
  readonly targetHash?: string;
  readonly conflictKeys?: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly proofIds?: readonly string[];
  readonly replayIds?: readonly string[];
  readonly actor?: SemanticHistoryActorRef;
  readonly recordSource?: SemanticHistoryRecordSourceRef;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticHistoryImportedParserEvidenceRecord {
  readonly kind: 'frontier.lang.semanticHistoryImportedParserEvidence';
  readonly version: 1;
  readonly id: string;
  readonly hash: string;
  readonly evidenceId?: string;
  readonly importId?: string;
  readonly parserId?: string;
  readonly parserKind?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly astHash?: string;
  readonly semanticIndexHash?: string;
  readonly status?: EvidenceRecord['status'] | string;
  readonly evidenceIds?: readonly string[];
  readonly replayIds?: readonly string[];
  readonly actor?: SemanticHistoryActorRef;
  readonly recordSource?: SemanticHistoryRecordSourceRef;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticHistoryProofAttemptRecord {
  readonly kind: 'frontier.lang.semanticHistoryProofAttempt';
  readonly version: 1;
  readonly id: string;
  readonly hash: string;
  readonly proofId?: string;
  readonly proofKind?: string;
  readonly status?: SemanticHistoryProofAttemptStatus;
  readonly proverId?: string;
  readonly claimIds?: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly proofIds?: readonly string[];
  readonly replayIds?: readonly string[];
  readonly command?: string;
  readonly resultHash?: string;
  readonly actor?: SemanticHistoryActorRef;
  readonly recordSource?: SemanticHistoryRecordSourceRef;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticHistoryPatchAncestryRecord {
  readonly kind: 'frontier.lang.semanticHistoryPatchAncestry';
  readonly version: 1;
  readonly id: string;
  readonly hash: string;
  readonly patchId?: string;
  readonly parentPatchIds?: readonly string[];
  readonly ancestorPatchIds?: readonly string[];
  readonly baseHash?: string;
  readonly targetHash?: string;
  readonly parentHashes?: readonly string[];
  readonly ancestorHashes?: readonly string[];
  readonly conflictKeys?: readonly string[];
  readonly actor?: SemanticHistoryActorRef;
  readonly recordSource?: SemanticHistoryRecordSourceRef;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticHistoryMergeDecisionRecord {
  readonly kind: 'frontier.lang.semanticHistoryMergeDecision';
  readonly version: 1;
  readonly id: string;
  readonly hash: string;
  readonly decision?: SemanticHistoryMergeDecisionStatus;
  readonly status?: SemanticHistoryMergeDecisionStatus;
  readonly decidedAt?: number | string;
  readonly claimIds?: readonly string[];
  readonly acceptedClaimIds?: readonly string[];
  readonly rejectedClaimIds?: readonly string[];
  readonly patchIds?: readonly string[];
  readonly conflictKeys?: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly proofIds?: readonly string[];
  readonly reasonCodes?: readonly string[];
  readonly actor?: SemanticHistoryActorRef;
  readonly recordSource?: SemanticHistoryRecordSourceRef;
  readonly metadata?: Record<string, unknown>;
}

export type SemanticHistoryClaimInput = string | (Partial<SemanticHistoryClaimRecord> & {
  readonly relation?: string;
  readonly value?: unknown;
  readonly expected?: unknown;
  readonly key?: string;
  readonly conflictKey?: string;
  readonly accepted?: boolean;
  readonly rejected?: boolean;
  readonly semanticNodeId?: string;
  readonly symbolId?: string;
});

export type SemanticHistoryImportedParserEvidenceInput = string | EvidenceRecord | (Partial<SemanticHistoryImportedParserEvidenceRecord> & {
  readonly parser?: string;
  readonly adapterId?: string;
  readonly nativeAstHash?: string;
});

export type SemanticHistoryProofAttemptInput = string | EvidenceRecord | (Partial<SemanticHistoryProofAttemptRecord> & {
  readonly prover?: string;
  readonly proofHash?: string;
});

export type SemanticHistoryPatchAncestryInput = string | (Partial<SemanticHistoryPatchAncestryRecord> & {
  readonly parents?: readonly string[] | string;
  readonly ancestors?: readonly string[] | string;
});

export type SemanticHistoryMergeDecisionInput = string | Partial<SemanticHistoryMergeDecisionRecord>;

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
  readonly actorIds: readonly string[];
  readonly recordSourceIds: readonly string[];
  readonly ownershipKeys: readonly string[];
  readonly semanticCandidateIds: readonly string[];
  readonly semanticClaimIds: readonly string[];
  readonly semanticClaimHashes: readonly string[];
  readonly acceptedFactIds: readonly string[];
  readonly rejectedTheoryIds: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly importedParserEvidenceIds: readonly string[];
  readonly importedParserEvidenceHashes: readonly string[];
  readonly proofIds: readonly string[];
  readonly proofAttemptIds: readonly string[];
  readonly proofAttemptHashes: readonly string[];
  readonly replayIds: readonly string[];
  readonly patchIds: readonly string[];
  readonly patchHashes: readonly string[];
  readonly mergeDecisionIds: readonly string[];
  readonly mergeDecisionHashes: readonly string[];
}
