import type { FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';
import type {
  JsTsSafeMergeAdmission,
  JsTsSafeMergeConflict,
  JsTsSafeMergeResult,
  JsTsSafeMergeSemanticArtifacts,
  JsTsSafeMergeSummary
} from './js-ts-safe-merge.js';
import type { JsTsSafeMemberMergePolicy, JsTsSafeMemberMergePolicyRegion } from './js-ts-safe-member-merge.js';
import type { NativeSourceImportResult } from './import-adapter-core.js';
import type { NativeProjectImportResult, NativeProjectSymbolGraphSummary } from './native-project.js';
import type { NativeProjectModuleResolutionOptions } from './native-project-module-resolution.js';

export type JsTsProjectSafeMergeStatus = 'merged' | 'blocked';
export type JsTsProjectSafeMergeFileStatus = 'merged' | 'blocked';
export type JsTsProjectSafeMergeFileOperation =
  | 'merged-source'
  | 'merged-source-and-members'
  | 'worker-added'
  | 'head-only'
  | 'both-added-identical'
  | 'worker-deleted'
  | 'head-deleted-worker-unchanged'
  | 'blocked-merge'
  | 'blocked-file-presence'
  | string;

export interface JsTsProjectSafeMergeFileInput {
  readonly sourcePath?: string;
  readonly path?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly baseSourceText?: string;
  readonly baseText?: string;
  readonly workerSourceText?: string;
  readonly workerText?: string;
  readonly headSourceText?: string;
  readonly headText?: string;
  readonly workerDeleted?: boolean;
  readonly headDeleted?: boolean;
  readonly policy?: JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[];
  readonly mergePolicy?: JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[];
}

export type JsTsProjectSafeMergeFileMap =
  | Readonly<Record<string, string>>
  | ReadonlyMap<string, string>
  | readonly { readonly sourcePath?: string; readonly path?: string; readonly sourceText?: string; readonly text?: string }[];

export type JsTsProjectSafeMergeOutputProjectImports =
  | readonly NativeSourceImportResult[]
  | ReadonlyMap<string, NativeSourceImportResult>
  | Readonly<Record<string, NativeSourceImportResult>>;

export interface JsTsProjectSafeMergeInput {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly projectRoot?: string;
  readonly files?: readonly JsTsProjectSafeMergeFileInput[];
  readonly baseFiles?: JsTsProjectSafeMergeFileMap;
  readonly workerFiles?: JsTsProjectSafeMergeFileMap;
  readonly headFiles?: JsTsProjectSafeMergeFileMap;
  readonly allowFileAdditions?: boolean;
  readonly allowFileDeletes?: boolean;
  readonly includeOutputProjectSymbolGraph?: boolean;
  readonly outputProjectImports?: JsTsProjectSafeMergeOutputProjectImports;
  readonly moduleResolution?: NativeProjectModuleResolutionOptions;
  readonly tsconfig?: NativeProjectModuleResolutionOptions;
  readonly workerChangeSetId?: string;
  readonly headChangeSetId?: string;
  readonly policy?: JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[];
  readonly mergePolicy?: JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[];
  readonly policyByPath?: Readonly<Record<string, JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[]>>;
  readonly mergePolicyByPath?: Readonly<Record<string, JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[]>>;
  readonly requireSourceLedgerSpans?: boolean;
  readonly sourceLedgers?: Record<string, unknown>;
  readonly sourceLedgersByPath?: Record<string, Record<string, unknown>>;
}

export interface JsTsProjectSafeMergeOutputFile {
  readonly sourcePath: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourceText: string;
  readonly sourceHash?: string;
  readonly operation: JsTsProjectSafeMergeFileOperation;
}

export interface JsTsProjectSafeMergeFileResult {
  readonly kind: 'frontier.lang.jsTsProjectSafeMergeFile';
  readonly version: 1;
  readonly sourcePath?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly status: JsTsProjectSafeMergeFileStatus;
  readonly operation: JsTsProjectSafeMergeFileOperation;
  readonly outputSourceText?: string;
  readonly outputHash?: string;
  readonly baseHash?: string;
  readonly workerHash?: string;
  readonly headHash?: string;
  readonly result?: JsTsSafeMergeResult;
  readonly semanticArtifacts?: JsTsSafeMergeSemanticArtifacts;
  readonly conflicts: readonly JsTsSafeMergeConflict[];
  readonly admission: JsTsSafeMergeAdmission;
  readonly summary?: JsTsSafeMergeSummary | Record<string, unknown>;
  readonly conflictKeys: readonly string[];
}

export interface JsTsProjectSafeMergeAdmission {
  readonly status: 'auto-merge-candidate' | 'blocked' | string;
  readonly action: 'apply-project' | 'human-review' | string;
  readonly reviewRequired: boolean;
  readonly autoApplyCandidate: boolean;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly reasonCodes: readonly string[];
  readonly conflictKeys: readonly string[];
}

export interface JsTsProjectSafeMergeResult {
  readonly kind: 'frontier.lang.jsTsProjectSafeMerge';
  readonly version: 1;
  readonly schema: 'frontier.lang.jsTsProjectSafeMerge.v1';
  readonly id: string;
  readonly hash: string;
  readonly status: JsTsProjectSafeMergeStatus;
  readonly files: readonly JsTsProjectSafeMergeFileResult[];
  readonly outputFiles: readonly JsTsProjectSafeMergeOutputFile[];
  readonly outputProjectImport?: NativeProjectImportResult;
  readonly outputProjectSymbolGraph?: NativeProjectSymbolGraphSummary;
  readonly conflicts: readonly JsTsSafeMergeConflict[];
  readonly admission: JsTsProjectSafeMergeAdmission;
  readonly summary: {
    readonly files: number;
    readonly mergedFiles: number;
    readonly blockedFiles: number;
    readonly outputFiles: number;
    readonly projectGraphConflicts: number;
    readonly semanticArtifactFiles: number;
    readonly operations: Readonly<Record<string, number>>;
  };
  readonly metadata?: Record<string, unknown>;
}

export declare function safeMergeJsTsProject(input?: JsTsProjectSafeMergeInput): JsTsProjectSafeMergeResult;
