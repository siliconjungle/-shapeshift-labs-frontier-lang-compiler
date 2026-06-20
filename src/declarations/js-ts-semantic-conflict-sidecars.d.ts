import type {
  FrontierSourceLanguage,
  SemanticMergeReadiness,
  SourceSpan
} from '@shapeshift-labs/frontier-lang-kernel';

export type JsTsSemanticConflictSidecarClass =
  | 'same-region'
  | 'delete-modify'
  | 'duplicate-export'
  | 'duplicate-member'
  | 'ordered-list-conflict'
  | 'parser-ledger-loss'
  | 'stale-source-hash'
  | 'unsupported-syntax';

export type JsTsSemanticConflictSidecarSeverity = 'info' | 'warning' | 'error';
export type JsTsSemanticConflictSidecarRisk = 'low' | 'medium' | 'high';

export interface JsTsSemanticConflictAffected {
  readonly sourcePaths: readonly string[];
  readonly spans: readonly SourceSpan[];
  readonly keys: readonly string[];
  readonly regionKeys: readonly string[];
  readonly symbolIds: readonly string[];
  readonly symbolNames: readonly string[];
  readonly memberKeys: readonly string[];
  readonly exportNames: readonly string[];
  readonly orderedListKeys: readonly string[];
  readonly sourceHashes: readonly string[];
}

export interface JsTsSemanticConflictExplanation {
  readonly class: JsTsSemanticConflictSidecarClass;
  readonly severity: JsTsSemanticConflictSidecarSeverity;
  readonly risk: JsTsSemanticConflictSidecarRisk;
  readonly affected: JsTsSemanticConflictAffected;
  readonly reasonCodes: readonly string[];
  readonly suggestedOutcome: string;
}

export interface JsTsSemanticConflictSidecarRecord {
  readonly kind: 'frontier.lang.jsTsSemanticMergeConflictSidecar';
  readonly version: 1;
  readonly schema: 'frontier.lang.jsTsSemanticMergeConflictSidecar.v1';
  readonly id: string;
  readonly class: JsTsSemanticConflictSidecarClass;
  readonly severity: JsTsSemanticConflictSidecarSeverity;
  readonly risk: JsTsSemanticConflictSidecarRisk;
  readonly readiness: SemanticMergeReadiness;
  readonly affected: JsTsSemanticConflictAffected;
  readonly reasonCodes: readonly string[];
  readonly suggestedOutcome: string;
  readonly explanation: JsTsSemanticConflictExplanation;
  readonly metadata?: Record<string, unknown>;
}

export interface JsTsSemanticConflictSidecarSummary {
  readonly schema: 'frontier.lang.jsTsSemanticConflictSidecarSummary.v1';
  readonly total: number;
  readonly classes: readonly JsTsSemanticConflictSidecarClass[];
  readonly byClass: Readonly<Record<string, number>>;
  readonly bySeverity: Readonly<Record<string, number>>;
  readonly byRisk: Readonly<Record<string, number>>;
  readonly highestSeverity: JsTsSemanticConflictSidecarSeverity;
  readonly highestRisk: JsTsSemanticConflictSidecarRisk;
  readonly readiness: SemanticMergeReadiness;
  readonly affectedSourcePaths: readonly string[];
  readonly affectedKeys: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly suggestedOutcome: string;
}

export interface JsTsSemanticConflictSidecarBundle {
  readonly kind: 'frontier.lang.jsTsSemanticMergeConflictSidecars';
  readonly version: 1;
  readonly schema: 'frontier.lang.jsTsSemanticMergeConflictSidecars.v1';
  readonly id: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly expectedSourceHash?: string;
  readonly currentSourceHash?: string;
  readonly conflicts: readonly JsTsSemanticConflictSidecarRecord[];
  readonly sidecars: readonly JsTsSemanticConflictSidecarRecord[];
  readonly summary: JsTsSemanticConflictSidecarSummary;
  readonly admission: {
    readonly status: SemanticMergeReadiness;
    readonly reviewRequired: boolean;
    readonly autoMergeSafe: boolean;
    readonly suggestedOutcome: string;
    readonly reasonCodes: readonly string[];
  };
  readonly metadata?: Record<string, unknown>;
}

export interface JsTsSemanticConflictChangeInput {
  readonly id?: string;
  readonly operationId?: string;
  readonly side?: string;
  readonly author?: string;
  readonly branch?: string;
  readonly source?: string;
  readonly kind?: string;
  readonly changeKind?: string;
  readonly editKind?: string;
  readonly op?: string;
  readonly sourcePath?: string;
  readonly sourceSpan?: SourceSpan;
  readonly span?: SourceSpan;
  readonly range?: SourceSpan;
  readonly key?: string;
  readonly conflictKey?: string;
  readonly regionKey?: string;
  readonly semanticKey?: string;
  readonly anchorKey?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly symbolKind?: string;
  readonly memberName?: string;
  readonly exportName?: string;
  readonly containerKey?: string;
  readonly parentKey?: string;
  readonly listKey?: string;
  readonly orderedListKey?: string;
  readonly index?: number | string;
  readonly position?: number | string;
  readonly orderKey?: string;
  readonly beforeKey?: string;
  readonly afterKey?: string;
  readonly sourceHash?: string;
  readonly reasonCode?: string;
  readonly reasonCodes?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface JsTsSemanticConflictDeclarationInput extends JsTsSemanticConflictChangeInput {
  readonly name?: string;
  readonly exported?: boolean;
  readonly isExport?: boolean;
  readonly member?: boolean;
  readonly isMember?: boolean;
}

export interface JsTsSemanticConflictLossInput {
  readonly id?: string;
  readonly kind?: string;
  readonly code?: string;
  readonly category?: string;
  readonly severity?: JsTsSemanticConflictSidecarSeverity | string;
  readonly status?: string;
  readonly sourcePath?: string;
  readonly sourceSpan?: SourceSpan;
  readonly key?: string;
  readonly message?: string;
  readonly summary?: string;
  readonly reasonCode?: string;
  readonly reasonCodes?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface JsTsSemanticConflictOrderedListInput {
  readonly id?: string;
  readonly key?: string;
  readonly sourcePath?: string;
  readonly sourceSpan?: SourceSpan;
  readonly changes?: readonly JsTsSemanticConflictChangeInput[];
  readonly operations?: readonly JsTsSemanticConflictChangeInput[];
  readonly edits?: readonly JsTsSemanticConflictChangeInput[];
}

export interface CreateJsTsSemanticConflictSidecarsInput {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly path?: string;
  readonly readiness?: SemanticMergeReadiness | string;
  readonly expectedSourceHash?: string;
  readonly currentSourceHash?: string;
  readonly expectedHash?: string;
  readonly actualSourceHash?: string;
  readonly staleSourceHash?: boolean;
  readonly sourceHashAssertions?: {
    readonly expectedSourceHash?: string;
    readonly currentSourceHash?: string;
  };
  readonly sourceHashes?: {
    readonly expectedSourceHash?: string;
    readonly currentSourceHash?: string;
  };
  readonly changes?: readonly JsTsSemanticConflictChangeInput[];
  readonly operations?: readonly JsTsSemanticConflictChangeInput[];
  readonly edits?: readonly JsTsSemanticConflictChangeInput[];
  readonly left?: {
    readonly changes?: readonly JsTsSemanticConflictChangeInput[];
    readonly operations?: readonly JsTsSemanticConflictChangeInput[];
  };
  readonly right?: {
    readonly changes?: readonly JsTsSemanticConflictChangeInput[];
    readonly operations?: readonly JsTsSemanticConflictChangeInput[];
  };
  readonly declarations?: readonly JsTsSemanticConflictDeclarationInput[];
  readonly exports?: readonly JsTsSemanticConflictDeclarationInput[];
  readonly members?: readonly JsTsSemanticConflictDeclarationInput[];
  readonly symbols?: readonly JsTsSemanticConflictDeclarationInput[];
  readonly orderedLists?: readonly JsTsSemanticConflictOrderedListInput[];
  readonly parserLosses?: readonly JsTsSemanticConflictLossInput[];
  readonly ledgerLosses?: readonly JsTsSemanticConflictLossInput[];
  readonly losses?: readonly JsTsSemanticConflictLossInput[];
  readonly diagnostics?: readonly JsTsSemanticConflictLossInput[];
  readonly unsupportedSyntax?: readonly JsTsSemanticConflictLossInput[];
  readonly syntaxUnsupported?: readonly JsTsSemanticConflictLossInput[];
  readonly syntaxLosses?: readonly JsTsSemanticConflictLossInput[];
  readonly conflicts?: readonly Partial<JsTsSemanticConflictSidecarRecord>[];
  readonly sidecars?: readonly Partial<JsTsSemanticConflictSidecarRecord>[];
  readonly conflictSidecars?: readonly Partial<JsTsSemanticConflictSidecarRecord>[];
  readonly metadata?: Record<string, unknown>;
}

export interface CreateJsTsSemanticConflictSidecarsOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly readiness?: SemanticMergeReadiness | string;
  readonly expectedSourceHash?: string;
  readonly currentSourceHash?: string;
  readonly metadata?: Record<string, unknown>;
}

export declare const JsTsSemanticConflictSidecarClasses: readonly JsTsSemanticConflictSidecarClass[];
export declare function createJsTsSemanticConflictSidecars(input?: CreateJsTsSemanticConflictSidecarsInput, options?: CreateJsTsSemanticConflictSidecarsOptions): JsTsSemanticConflictSidecarBundle;
export declare function summarizeJsTsSemanticConflictSidecars(records?: readonly JsTsSemanticConflictSidecarRecord[], context?: {
  readonly sourcePath?: string;
  readonly readiness?: SemanticMergeReadiness | string;
}): JsTsSemanticConflictSidecarSummary;
