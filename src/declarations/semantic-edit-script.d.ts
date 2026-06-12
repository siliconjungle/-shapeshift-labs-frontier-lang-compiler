import type { EvidenceRecord, FrontierSourceLanguage, SemanticMergeReadiness, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { ImportNativeSourceOptions, NativeSourceImportResult } from './import-adapter-core.js';
import type { SemanticEditReplayDiagnostic } from './semantic-edit-replay-diagnostics.js';
export type * from './semantic-edit-replay-diagnostics.js';
export type SemanticEditScriptOperationStatus = 'candidate' | 'portable' | 'already-applied' | 'covered' | 'needs-port' | 'conflict' | 'stale' | 'blocked';
export type SemanticEditScriptAdmissionStatus = 'auto-merge-candidate' | 'needs-port' | 'conflict' | 'stale' | 'blocked' | 'evidence-only';
export interface SemanticEditInsertionAnchorCandidate {
  readonly mode?: 'before' | 'after' | 'file-start' | 'file-end' | string;
  readonly anchorKey?: string;
  readonly anchorSymbolId?: string;
  readonly anchorSymbolName?: string;
  readonly anchorSymbolKind?: string;
  readonly baseSpan?: SourceSpan;
  readonly workerAnchorSpan?: SourceSpan;
  readonly headSpan?: SourceSpan;
  readonly sourcePath?: string;
  readonly reasonCodes?: readonly string[];
}
export interface SemanticEditScriptOperation {
  readonly id: string;
  readonly kind: string;
  readonly changeKind?: string;
  readonly anchor: {
    readonly key?: string; readonly conflictKey?: string; readonly regionId?: string;
    readonly regionKind?: string; readonly granularity?: string;
    readonly language?: FrontierSourceLanguage | string;
    readonly sourcePath?: string; readonly symbolId?: string; readonly symbolName?: string; readonly symbolKind?: string;
    readonly sourceSpan?: SourceSpan;
  };
  readonly insertion?: {
    readonly mode?: 'before' | 'after' | 'file-start' | 'file-end' | string;
    readonly anchorKey?: string; readonly anchorSymbolId?: string; readonly anchorSymbolName?: string; readonly anchorSymbolKind?: string;
    readonly baseSpan?: SourceSpan; readonly workerAnchorSpan?: SourceSpan; readonly headSpan?: SourceSpan; readonly sourcePath?: string;
    readonly anchorCandidates?: readonly SemanticEditInsertionAnchorCandidate[];
    readonly insertedSymbolId?: string; readonly insertedSymbolName?: string; readonly insertedSymbolKind?: string;
    readonly insertedSourceSpan?: SourceSpan; readonly insertedSourcePath?: string;
    readonly reasonCodes?: readonly string[];
  };
  readonly semanticKey?: string;
  readonly semanticIdentityHash?: string;
  readonly sourceIdentityHash?: string;
  readonly operationContentHash?: string;
  readonly spans?: {
    readonly base?: SourceSpan; readonly worker?: SourceSpan; readonly head?: SourceSpan;
  };
  readonly hashes?: {
    readonly baseSourceHash?: string; readonly workerSourceHash?: string; readonly headSourceHash?: string;
    readonly baseSpanHash?: string; readonly workerSpanHash?: string; readonly headSpanHash?: string;
    readonly baseTextHash?: string; readonly workerTextHash?: string; readonly headTextHash?: string;
    readonly beforeSignatureHash?: string; readonly afterSignatureHash?: string;
  };
  readonly status: SemanticEditScriptOperationStatus;
  readonly reanchor?: {
    readonly fromAnchorKey?: string;
    readonly toAnchorKey?: string;
    readonly toSourcePath?: string;
    readonly toSymbolName?: string;
    readonly toSymbolKind?: string;
    readonly lineageStatus?: string;
    readonly traversedEventIds?: readonly string[];
  };
  readonly readiness: SemanticMergeReadiness | string;
  readonly confidence: number;
  readonly reasonCodes: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}
export interface SemanticEditScriptSummary {
  readonly operations: number;
  readonly byStatus: Readonly<Record<string, number>>;
  readonly byKind: Readonly<Record<string, number>>;
  readonly portable: number;
  readonly alreadyApplied: number;
  readonly needsPort: number;
  readonly conflicts: number;
  readonly stale: number;
  readonly blocked: number;
  readonly covered?: number;
  readonly candidates: number;
  readonly autoMergeCandidates: number;
  readonly semanticKeys?: readonly string[];
  readonly semanticIdentityHashes?: readonly string[];
  readonly sourceIdentityHashes?: readonly string[];
  readonly operationContentHashes?: readonly string[];
}
export interface SemanticEditScriptAdmission {
  readonly status: SemanticEditScriptAdmissionStatus;
  readonly action: 'run-gates-and-apply' | 'reanchor-or-human-port' | 'record-evidence' | 'block' | string;
  readonly reviewRequired: boolean;
  readonly autoApplyCandidate: boolean;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly reasonCodes: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly evidenceIds: readonly string[];
}
export interface SemanticEditScript {
  readonly kind: 'frontier.lang.semanticEditScript';
  readonly version: 1;
  readonly schema: 'frontier.lang.semanticEditScript.v1';
  readonly id: string;
  readonly stableId: string;
  readonly hash: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly baseHash?: string;
  readonly workerHash?: string;
  readonly headHash?: string;
  readonly workerChangeSetId: string;
  readonly headChangeSetId?: string;
  readonly lineageInferenceId?: string;
  readonly operations: readonly SemanticEditScriptOperation[];
  readonly summary: SemanticEditScriptSummary;
  readonly admission: SemanticEditScriptAdmission;
  readonly evidence: readonly EvidenceRecord[];
  readonly metadata?: Record<string, unknown>;
}
export interface SemanticEditProjectionEdit {
  readonly operationId?: string;
  readonly status: 'applied' | 'already-applied';
  readonly kind?: string;
  readonly editKind?: 'replace' | 'insert' | 'delete' | string;
  readonly changeKind?: string;
  readonly anchorKey?: string;
  readonly conflictKey?: string;
  readonly regionId?: string;
  readonly regionKind?: string;
  readonly sourcePath?: string;
  readonly originalSourcePath?: string;
  readonly targetAnchorKey?: string;
  readonly targetSourcePath?: string;
  readonly targetSymbolName?: string;
  readonly targetSymbolKind?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly symbolKind?: string;
  readonly semanticKey?: string;
  readonly semanticIdentityHash?: string;
  readonly sourceIdentityHash?: string;
  readonly sourceIdentityStatus?: 'same-source' | 'moved-source' | string;
  readonly sourceIdentityAnchorKey?: string; readonly targetIdentityAnchorKey?: string;
  readonly sourceIdentitySourcePath?: string; readonly targetIdentitySourcePath?: string;
  readonly operationContentHash?: string;
  readonly editContentHash?: string;
  readonly headStart: number;
  readonly headEnd: number;
  readonly workerStart?: number;
  readonly workerEnd?: number;
  readonly deletedBytes: number;
  readonly replacementBytes: number;
  readonly deletedTextHash?: string;
  readonly replacementTextHash?: string;
  readonly deletedTextLineEndingStableHash?: string;
  readonly replacementTextLineEndingStableHash?: string;
  readonly replacementSpanTextHash?: string;
  readonly replacementSpanTextLineEndingStableHash?: string;
  readonly insertionMode?: string;
  readonly insertionAnchorKey?: string;
  readonly insertionAnchorSymbolName?: string;
  readonly insertionAnchorSymbolKind?: string;
  readonly insertionAnchorCandidates?: readonly SemanticEditInsertionAnchorCandidate[];
  readonly replacementText?: string;
}
export interface SemanticEditProjection {
  readonly kind: 'frontier.lang.semanticEditProjection';
  readonly version: 1;
  readonly id: string;
  readonly hash: string;
  readonly scriptId?: string;
  readonly status: 'projected' | 'blocked';
  readonly sourcePath?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly baseHash?: string;
  readonly workerHash?: string;
  readonly headHash?: string;
  readonly projectedHash?: string;
  readonly appliedOperations: readonly string[];
  readonly skippedOperations: readonly string[];
  readonly edits: readonly SemanticEditProjectionEdit[];
  readonly sourceText?: string;
  readonly admission: {
    readonly status: 'auto-merge-candidate' | 'blocked';
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly reasonCodes: readonly string[];
  };
  readonly metadata?: Record<string, unknown>;
}
export type SemanticEditReplayStatus = 'accepted-clean' | 'already-applied' | 'conflict' | 'stale' | 'blocked' | 'needs-port' | 'evidence-only';
export interface SemanticEditReplayEdit {
  readonly operationId?: string;
  readonly semanticKey?: string;
  readonly semanticIdentityHash?: string;
  readonly sourceIdentityHash?: string;
  readonly editContentHash?: string;
  readonly editKind?: 'replace' | 'insert' | 'delete' | string;
  readonly editOrder?: number;
  readonly sourceRangeKind?: string;
  readonly sourcePath?: string;
  readonly symbolName?: string;
  readonly symbolKind?: string;
  readonly status: 'applied' | 'already-applied' | 'conflict' | 'stale' | 'blocked' | string;
  readonly start?: number;
  readonly end?: number;
  readonly replacementBytes?: number;
  readonly replacementText?: string;
  readonly reasonCodes: readonly string[];
  readonly diagnostics?: readonly SemanticEditReplayDiagnostic[];
}
export interface SemanticEditReplay {
  readonly kind: 'frontier.lang.semanticEditReplay';
  readonly version: 1;
  readonly schema: 'frontier.lang.semanticEditReplay.v1';
  readonly id: string;
  readonly hash: string;
  readonly projectionId?: string;
  readonly scriptId?: string;
  readonly sourcePath?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly currentHash?: string;
  readonly projectedHash?: string;
  readonly outputHash?: string;
  readonly status: SemanticEditReplayStatus;
  readonly edits: readonly SemanticEditReplayEdit[];
  readonly appliedOperations: readonly string[];
  readonly skippedOperations: readonly string[];
  readonly diagnostics?: readonly SemanticEditReplayDiagnostic[];
  readonly admission: {
    readonly status: SemanticEditReplayStatus;
    readonly action: 'apply' | 'skip' | 'rerun-semantic-import' | 'human-review' | 'block' | string;
    readonly reviewRequired: boolean;
    readonly autoApplyCandidate: boolean;
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly reasonCodes: readonly string[];
  };
  readonly outputSourceText?: string;
  readonly summary: {
    readonly edits: number;
    readonly applied: number;
    readonly alreadyApplied: number;
    readonly conflicts: number;
    readonly stale: number;
    readonly blocked: number;
    readonly reasonCodes: readonly string[];
  };
  readonly metadata?: Record<string, unknown>;
}
export interface ProjectSemanticEditScriptToSourceOptions {
  readonly id?: string;
  readonly script: SemanticEditScript;
  readonly workerSourceText: string;
  readonly headSourceText: string;
  readonly headSourcePath?: string;
  readonly metadata?: Record<string, unknown>;
}
export interface ReplaySemanticEditProjectionOptions {
  readonly id?: string;
  readonly projection?: SemanticEditProjection;
  readonly semanticEditProjection?: SemanticEditProjection;
  readonly currentSourceText?: string;
  readonly headSourceText?: string;
  readonly currentSourcePath?: string;
  readonly headSourcePath?: string;
  readonly currentSourceHash?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly parser?: string;
  readonly metadata?: Record<string, unknown>;
}
export interface CreateSemanticEditScriptOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly parser?: string;
  readonly base?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly before?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly worker?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly after?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly head?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly current?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly baseSourceText?: string;
  readonly beforeSourceText?: string;
  readonly workerSourceText?: string;
  readonly afterSourceText?: string;
  readonly headSourceText?: string;
  readonly baseSourcePath?: string;
  readonly beforeSourcePath?: string;
  readonly workerSourcePath?: string;
  readonly afterSourcePath?: string;
  readonly headSourcePath?: string;
  readonly currentSourceText?: string;
  readonly currentSourcePath?: string;
  readonly baseSourceHash?: string;
  readonly beforeSourceHash?: string;
  readonly workerSourceHash?: string;
  readonly afterSourceHash?: string;
  readonly headSourceHash?: string;
  readonly currentSourceHash?: string;
  readonly baseMetadata?: Record<string, unknown>;
  readonly beforeMetadata?: Record<string, unknown>;
  readonly workerMetadata?: Record<string, unknown>;
  readonly afterMetadata?: Record<string, unknown>;
  readonly headMetadata?: Record<string, unknown>;
  readonly currentMetadata?: Record<string, unknown>;
  readonly workerChangeSetId?: string;
  readonly headChangeSetId?: string;
  readonly lineageInferenceId?: string;
  readonly generatedAt?: number | string;
  readonly evidenceId?: string;
  readonly metadata?: Record<string, unknown>;
}
export interface CreateSemanticEditScriptRuntimeOptions {
  readonly metadata?: Record<string, unknown>;
}
export declare const SemanticEditScriptAdmissionStatuses: readonly SemanticEditScriptAdmissionStatus[];
export declare function createSemanticEditScript(input?: CreateSemanticEditScriptOptions, options?: CreateSemanticEditScriptRuntimeOptions): SemanticEditScript;
export declare function projectSemanticEditScriptToSource(input: ProjectSemanticEditScriptToSourceOptions): SemanticEditProjection;
export declare function replaySemanticEditProjection(input: ReplaySemanticEditProjectionOptions): SemanticEditReplay;
