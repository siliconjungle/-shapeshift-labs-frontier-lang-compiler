import type { FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';
import type { SemanticEditProjection, SemanticEditReplay, SemanticEditScript } from './semantic-edit-script.js';
import type {
  JsTsSafeMemberMergePolicy,
  JsTsSafeMemberMergePolicyRegion
} from './js-ts-safe-member-merge.js';

export type JsTsSafeMergeStatus = 'merged' | 'blocked';
export type JsTsSafeMergeGateStatus = 'passed' | 'blocked' | 'skipped';

export declare const JsTsSafeMergeStatuses: Readonly<{
  readonly merged: 'merged';
  readonly blocked: 'blocked';
}>;

export declare const JsTsSafeMergeGateIds: Readonly<{
  readonly parseLedger: 'parse-ledger';
  readonly preserveBaseOrder: 'preserve-base-order';
  readonly stableExistingDeclarations: 'stable-existing-declarations';
  readonly independentImportSpecifiers: 'independent-import-specifiers';
  readonly independentTopLevelDeclarations: 'independent-top-level-declarations';
  readonly uniqueNames: 'unique-names';
  readonly resolvedInsertionAnchors: 'resolved-insertion-anchors';
}>;

export declare const JsTsSafeMergeConflictCodes: Readonly<{
  readonly invalidInput: 'invalid-input';
  readonly parserLedgerLoss: 'parser-ledger-loss';
  readonly malformedSyntax: 'malformed-syntax';
  readonly sideEffectImportReorder: 'side-effect-import-reorder';
  readonly topLevelOrderChanged: 'top-level-order-changed';
  readonly changedExistingDeclaration: 'changed-existing-declaration';
  readonly typeAliasConflict: 'type-alias-conflict';
  readonly importShapeChanged: 'import-shape-changed';
  readonly importSpecifierRemoved: 'import-specifier-removed';
  readonly importSpecifierReordered: 'import-specifier-reordered';
  readonly importFormattingChanged: 'import-formatting-changed';
  readonly newImportDeclaration: 'new-import-declaration';
  readonly duplicateName: 'duplicate-name';
  readonly computedKey: 'computed-key';
  readonly unsupportedDecorator: 'unsupported-decorator-merge-anchor';
  readonly unsupportedOverload: 'unsupported-overload-merge-anchor';
  readonly staleSourceHash: 'stale-source-hash';
  readonly missingSourceLedgerSpan: 'missing-source-ledger-span';
  readonly ambiguousInsertionPoint: 'ambiguous-insertion-point';
  readonly insertionAnchorMissing: 'insertion-anchor-missing';
}>;

export interface JsTsSafeMergeInput {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly baseSourceText: string;
  readonly workerSourceText: string;
  readonly headSourceText: string;
  readonly workerChangeSetId?: string;
  readonly headChangeSetId?: string;
  readonly baseHash?: string;
  readonly workerHash?: string;
  readonly headHash?: string;
  readonly expectedSourceHash?: string;
  readonly currentSourceHash?: string;
  readonly expectedBaseHash?: string;
  readonly expectedWorkerHash?: string;
  readonly expectedHeadHash?: string;
  readonly requireSourceLedgerSpans?: boolean;
  readonly sourceLedgerSide?: 'base' | 'worker' | 'head' | string;
  readonly sourceLedger?: unknown;
  readonly sourceLedgers?: Record<string, unknown>;
  readonly baseSourceLedger?: unknown;
  readonly workerSourceLedger?: unknown;
  readonly headSourceLedger?: unknown;
  readonly policy?: JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[];
  readonly mergePolicy?: JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[];
  readonly unorderedRegions?: readonly JsTsSafeMemberMergePolicyRegion[];
}

export interface JsTsSafeMergeConflict {
  readonly code: string;
  readonly gateId: string;
  readonly message: string;
  readonly side?: 'base' | 'worker' | 'head' | 'merged' | string;
  readonly sourcePath?: string;
  readonly details?: Record<string, unknown>;
}

export interface JsTsSafeMergeGate {
  readonly id: string;
  readonly status: JsTsSafeMergeGateStatus;
  readonly reasonCodes: readonly string[];
}

export interface JsTsSafeMergeAdmission {
  readonly status: 'auto-merge-candidate' | 'blocked' | string;
  readonly action: 'apply' | 'human-review' | string;
  readonly reviewRequired: boolean;
  readonly autoApplyCandidate: boolean;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly reasonCodes: readonly string[];
}

export interface JsTsSafeMergeSummary {
  readonly importSpecifierAdditions: number;
  readonly importDeclarationAdditions: number;
  readonly topLevelDeclarationAdditions: number;
  readonly changedExistingDeclarations: number;
  readonly conflicts: number;
  readonly gatesPassed: number;
  readonly memberRegions?: number;
  readonly memberAdditions?: number;
  readonly composedPhases?: number;
}

export interface JsTsSafeMergeSemanticArtifacts {
  readonly kind: 'frontier.lang.jsTsSafeMergeSemanticArtifacts';
  readonly version: 1;
  readonly schema: 'frontier.lang.jsTsSafeMergeSemanticArtifacts.v1';
  readonly id: string;
  readonly hash: string;
  readonly sourcePath?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly status: 'verified' | 'blocked' | string;
  readonly script?: SemanticEditScript;
  readonly projection?: SemanticEditProjection;
  readonly replay?: SemanticEditReplay;
  readonly alreadyAppliedReplay?: SemanticEditReplay;
  readonly admission: {
    readonly status: 'auto-merge-candidate' | 'blocked' | string;
    readonly action: 'apply' | 'human-review' | string;
    readonly reviewRequired: boolean;
    readonly autoApplyCandidate: boolean;
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly reasonCodes: readonly string[];
  };
  readonly summary: {
    readonly operations: number;
    readonly edits: number;
    readonly replayStatus?: string;
    readonly alreadyAppliedReplayStatus?: string;
    readonly projectedSourceMatchesMerged: boolean;
    readonly replayOutputMatchesMerged: boolean;
  };
  readonly evidence?: readonly unknown[];
  readonly metadata?: Record<string, unknown>;
}

export interface JsTsSafeMergeResult {
  readonly kind: 'frontier.lang.jsTsSafeMerge';
  readonly version: 1;
  readonly schema: 'frontier.lang.jsTsSafeMerge.v1';
  readonly id: string;
  readonly status: JsTsSafeMergeStatus;
  readonly sourcePath?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly mergedSourceText?: string;
  readonly outputSourceText?: string;
  readonly conflicts: readonly JsTsSafeMergeConflict[];
  readonly gates: readonly JsTsSafeMergeGate[];
  readonly admission: JsTsSafeMergeAdmission;
  readonly summary: JsTsSafeMergeSummary;
  readonly semanticArtifacts?: JsTsSafeMergeSemanticArtifacts;
  readonly metadata?: Record<string, unknown>;
}

export declare function safeMergeJsTsImportsAndDeclarations(input: JsTsSafeMergeInput): JsTsSafeMergeResult;
export declare function safeMergeJsTsSource(input: JsTsSafeMergeInput): JsTsSafeMergeResult;
