import type {
  EvidenceRecord,
  FrontierSourceLanguage,
  SemanticMergeReadiness,
  SourceSpan
} from '@shapeshift-labs/frontier-lang-kernel';
import type { ImportNativeSourceOptions, NativeSourceImportResult } from './import-adapter-core.js';

export type SemanticEditScriptOperationStatus =
  | 'candidate'
  | 'portable'
  | 'already-applied'
  | 'needs-port'
  | 'conflict'
  | 'stale'
  | 'blocked';

export type SemanticEditScriptAdmissionStatus =
  | 'auto-merge-candidate'
  | 'needs-port'
  | 'conflict'
  | 'stale'
  | 'blocked'
  | 'evidence-only';

export interface SemanticEditScriptOperation {
  readonly id: string;
  readonly kind: string;
  readonly changeKind?: string;
  readonly anchor: {
    readonly key?: string;
    readonly conflictKey?: string;
    readonly regionId?: string;
    readonly regionKind?: string;
    readonly granularity?: string;
    readonly language?: FrontierSourceLanguage | string;
    readonly sourcePath?: string;
    readonly symbolId?: string;
    readonly symbolName?: string;
    readonly symbolKind?: string;
    readonly sourceSpan?: SourceSpan;
  };
  readonly spans?: {
    readonly base?: SourceSpan;
    readonly worker?: SourceSpan;
    readonly head?: SourceSpan;
  };
  readonly hashes?: {
    readonly baseSourceHash?: string;
    readonly workerSourceHash?: string;
    readonly headSourceHash?: string;
    readonly baseSpanHash?: string;
    readonly workerSpanHash?: string;
    readonly headSpanHash?: string;
    readonly baseTextHash?: string;
    readonly workerTextHash?: string;
    readonly headTextHash?: string;
    readonly beforeSignatureHash?: string;
    readonly afterSignatureHash?: string;
  };
  readonly status: SemanticEditScriptOperationStatus;
  readonly reanchor?: {
    readonly fromAnchorKey?: string;
    readonly toAnchorKey?: string;
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
  readonly candidates: number;
  readonly autoMergeCandidates: number;
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
  readonly headStart: number;
  readonly headEnd: number;
  readonly workerStart?: number;
  readonly workerEnd?: number;
  readonly deletedBytes: number;
  readonly replacementBytes: number;
  readonly deletedTextHash?: string;
  readonly replacementTextHash?: string;
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

export interface ProjectSemanticEditScriptToSourceOptions {
  readonly id?: string;
  readonly script: SemanticEditScript;
  readonly workerSourceText: string;
  readonly headSourceText: string;
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
  readonly currentSourceText?: string;
  readonly baseSourceHash?: string;
  readonly workerSourceHash?: string;
  readonly headSourceHash?: string;
  readonly generatedAt?: number;
  readonly evidenceId?: string;
  readonly metadata?: Record<string, unknown>;
}

export declare const SemanticEditScriptAdmissionStatuses: readonly SemanticEditScriptAdmissionStatus[];
export declare function createSemanticEditScript(input?: CreateSemanticEditScriptOptions): SemanticEditScript;
export declare function projectSemanticEditScriptToSource(input: ProjectSemanticEditScriptToSourceOptions): SemanticEditProjection;
