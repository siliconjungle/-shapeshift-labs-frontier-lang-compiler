import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { UniversalControlFlowConstraintEvidence } from './universal-control-flow-constraints.js';
import type { UniversalLifetimeConstraintEvidence } from './universal-lifetime-constraints.js';
import type { UniversalOwnershipConstraintEvidence } from './universal-ownership-constraints.js';
import type { UniversalResourceTransferEvidence } from './universal-resource-transfer.js';

export type UniversalBorrowScopeConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalBorrowScopeConstraintAction = 'skip' | 'attach-borrow-scope-constraint-record' | 'review-borrow-scope-constraint-loss' | 'collect-borrow-scope-constraint-evidence' | 'reject';

export interface UniversalBorrowScopeRecordInput {
  readonly id?: string;
  readonly role?: 'source' | 'target' | string;
  readonly kind?: string;
  readonly constraintKind?: string;
  readonly scopeKind?: string;
  readonly predicate?: string;
  readonly ownershipKind?: string;
  readonly lifetimeKind?: string;
  readonly controlFlowKind?: string;
  readonly flowKind?: string;
  readonly sourceControlFlowId?: string;
  readonly flowId?: string;
  readonly lifetimeRegionId?: string;
  readonly regionId?: string;
  readonly resourceId?: string;
  readonly constraintKinds?: readonly string[];
  readonly factKinds?: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: { readonly factKinds?: readonly string[]; readonly [key: string]: unknown };
}

export interface UniversalBorrowScopeConstraintRecord {
  readonly id: string;
  readonly role: string;
  readonly scopeKind?: string;
  readonly ownershipKind?: string;
  readonly lifetimeKind?: string;
  readonly controlFlowKind?: string;
  readonly sourceControlFlowId?: string;
  readonly lifetimeRegionId?: string;
  readonly resourceId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly constraintKinds: readonly string[];
  readonly evidenceIds: readonly string[];
}

export interface UniversalBorrowScopeConstraintModel {
  readonly scopeKinds: readonly string[];
  readonly ownershipKinds: readonly string[];
  readonly lifetimeKinds: readonly string[];
  readonly flowKinds: readonly string[];
  readonly hasBorrow: boolean;
  readonly hasSharedBorrow: boolean;
  readonly hasExclusive: boolean;
  readonly hasExclusiveAliasExclusion: boolean;
  readonly hasExclusiveLoanExclusion: boolean;
  readonly hasMove: boolean;
  readonly hasDrop: boolean;
  readonly hasNoEscape: boolean;
  readonly hasUnsafe: boolean;
  readonly hasBranch: boolean;
  readonly hasAsync: boolean;
  readonly hasExit: boolean;
  readonly hasConcurrency: boolean;
  readonly hasReborrow: boolean;
  readonly hasTwoPhaseBorrow: boolean;
  readonly hasInteriorMutability: boolean;
  readonly hasPinProjection: boolean;
  readonly hasClosureCapture: boolean;
  readonly hasIteratorYield: boolean;
  readonly hasDropCheck: boolean;
}

export interface UniversalBorrowScopeConstraintSide {
  readonly role: 'source' | 'target';
  readonly scopes: readonly UniversalBorrowScopeConstraintRecord[];
  readonly model: UniversalBorrowScopeConstraintModel;
}

export interface UniversalBorrowScopeConstraintLoss {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly sourceBorrowScopeIds: readonly string[];
  readonly targetBorrowScopeIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalBorrowScopeConstraintEvidence {
  readonly kind: 'frontier.lang.universalBorrowScopeConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalBorrowScopeConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalBorrowScopeConstraintStatus;
  readonly action: UniversalBorrowScopeConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly source: UniversalBorrowScopeConstraintSide;
  readonly targetSide: UniversalBorrowScopeConstraintSide;
  readonly constraints: readonly UniversalBorrowScopeConstraintLoss[];
  readonly evidenceIds: readonly string[];
  readonly claims: {
    readonly borrowCheckerClaim: false;
    readonly flowSensitiveLifetimeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalBorrowScopeConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[];
  readonly resourceTransfer?: UniversalResourceTransferEvidence;
  readonly ownershipConstraint?: UniversalOwnershipConstraintEvidence;
  readonly targetOwnershipConstraint?: UniversalOwnershipConstraintEvidence;
  readonly lifetimeConstraint?: UniversalLifetimeConstraintEvidence;
  readonly targetLifetimeConstraint?: UniversalLifetimeConstraintEvidence;
  readonly controlFlowConstraint?: UniversalControlFlowConstraintEvidence;
  readonly targetControlFlowConstraint?: UniversalControlFlowConstraintEvidence;
  readonly borrowScopes?: readonly UniversalBorrowScopeRecordInput[];
  readonly sourceBorrowScopes?: readonly UniversalBorrowScopeRecordInput[];
  readonly targetBorrowScopes?: readonly UniversalBorrowScopeRecordInput[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalBorrowScopeConstraintQuery {
  readonly borrowScopeConstraintStatus?: UniversalBorrowScopeConstraintStatus | string | readonly string[];
  readonly borrowScopeConstraintAction?: UniversalBorrowScopeConstraintAction | string | readonly string[];
  readonly borrowScopeConstraintRequiredKind?: string | readonly string[];
  readonly borrowScopeConstraintRepresentedKind?: string | readonly string[];
  readonly borrowScopeConstraintMissingKind?: string | readonly string[];
  readonly borrowScopeConstraintMissingEvidence?: string | readonly string[];
  readonly borrowScopeConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalBorrowScopeConstraintStatuses: readonly UniversalBorrowScopeConstraintStatus[];
export declare function createUniversalBorrowScopeConstraintEvidence(input?: UniversalBorrowScopeConstraintInput): UniversalBorrowScopeConstraintEvidence;
export declare function borrowScopeConstraintMatches(evidence?: Partial<UniversalBorrowScopeConstraintEvidence>, query?: UniversalBorrowScopeConstraintQuery): boolean;
