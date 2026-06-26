import type { FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';
import type { SemanticEditScriptOperationStatus } from './semantic-edit-script.js';

export type SemanticStructuralEditAction = 'move' | 'update' | 'insert' | 'delete';
export type SemanticStructuralEditKind = 'move' | 'update' | 'insert' | 'delete' | 'move-update';

export interface SemanticStructuralEditSpanLocation {
  readonly path?: string;
  readonly startLine?: number;
  readonly startColumn?: number;
  readonly endLine?: number;
  readonly endColumn?: number;
}

export interface SemanticStructuralEdit {
  readonly id: string;
  readonly kind: 'frontier.lang.semanticStructuralEdit';
  readonly version: 1;
  readonly hash: string;
  readonly algorithm: 'frontier.semantic-edit-structural-diff.v1';
  readonly runtimeNeutral: true;
  readonly operationId?: string;
  readonly structuralKind: SemanticStructuralEditKind | string;
  readonly actions: readonly (SemanticStructuralEditAction | string)[];
  readonly operationKind?: string;
  readonly changeKind?: string;
  readonly anchorKey?: string;
  readonly conflictKey?: string;
  readonly regionKind?: string;
  readonly sourcePath?: string;
  readonly symbolName?: string;
  readonly symbolKind?: string;
  readonly from?: SemanticStructuralEditSpanLocation;
  readonly to?: SemanticStructuralEditSpanLocation;
  readonly head?: SemanticStructuralEditSpanLocation;
  readonly baseTextHash?: string;
  readonly workerTextHash?: string;
  readonly headTextHash?: string;
  readonly beforeSignatureHash?: string;
  readonly afterSignatureHash?: string;
  readonly status?: SemanticEditScriptOperationStatus | string;
  readonly reviewRequired: true;
  readonly confidence?: number;
  readonly reasonCodes: readonly string[];
  readonly reanchor?: {
    readonly fromAnchorKey?: string;
    readonly toAnchorKey?: string;
    readonly toSourcePath?: string;
    readonly toSymbolName?: string;
    readonly toSymbolKind?: string;
    readonly lineageStatus?: string;
    readonly traversedEventIds?: readonly string[];
  };
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticStructuralDiffSummary {
  readonly edits: number;
  readonly byKind: Readonly<Record<string, number>>;
  readonly byAction: Readonly<Record<string, number>>;
  readonly moves: number;
  readonly updates: number;
  readonly inserts: number;
  readonly deletes: number;
  readonly moveUpdates: number;
  readonly reviewRequired: boolean;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface SemanticStructuralDiff {
  readonly kind: 'frontier.lang.semanticStructuralDiff';
  readonly version: 1;
  readonly schema: 'frontier.lang.semanticStructuralDiff.v1';
  readonly id: string;
  readonly hash: string;
  readonly algorithm: 'frontier.semantic-edit-structural-diff.v1';
  readonly runtimeNeutral: true;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly workerChangeSetId: string;
  readonly headChangeSetId?: string;
  readonly edits: readonly SemanticStructuralEdit[];
  readonly summary: SemanticStructuralDiffSummary;
  readonly admission: {
    readonly status: 'review-required';
    readonly action: 'run-replay-and-diagnostics' | string;
    readonly reviewRequired: true;
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly reasonCodes: readonly string[];
  };
  readonly metadata?: Record<string, unknown>;
}
