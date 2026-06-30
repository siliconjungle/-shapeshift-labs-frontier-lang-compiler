import type { FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { SemanticResourceGraph } from './semantic-resource-graph.js';
import type { UniversalBorrowScopeConstraintEvidence, UniversalBorrowScopeConstraintInput, UniversalBorrowScopeConstraintQuery } from './universal-borrow-scope-constraints.js';
import type { UniversalControlFlowConstraintEvidence } from './universal-control-flow-constraints.js';
import type { UniversalLifetimeConstraintEvidence, UniversalLifetimeConstraintInput, UniversalLifetimeConstraintQuery } from './universal-lifetime-constraints.js';
import type { UniversalOwnershipConstraintEvidence, UniversalOwnershipConstraintQuery } from './universal-ownership-constraints.js';
import type { UniversalResourceTransferEvidence, UniversalResourceTransferInput, UniversalResourceTransferQuery } from './universal-resource-transfer.js';

export type UniversalBorrowCheckerConstraintStatus = 'not-applicable' | 'preserved' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalBorrowCheckerConstraintAction = 'skip' | 'attach-borrow-checker-record' | 'review-borrow-checker-loss' | 'collect-borrow-checker-evidence' | 'reject';

export interface UniversalBorrowCheckerConstraintComponent {
  readonly family: 'resource-transfer' | 'ownership' | 'lifetime' | 'borrow-scope' | string;
  readonly id?: string;
  readonly status?: string;
  readonly action?: string;
  readonly applicable: boolean;
  readonly preserved: boolean;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly evidence?: Record<string, unknown>;
}

export interface UniversalBorrowCheckerConstraintEvidence {
  readonly kind: 'frontier.lang.universalBorrowCheckerConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalBorrowCheckerConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalBorrowCheckerConstraintStatus;
  readonly action: UniversalBorrowCheckerConstraintAction;
  readonly requiredFamilies: readonly string[];
  readonly missingFamilies: readonly string[];
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly components: readonly UniversalBorrowCheckerConstraintComponent[];
  readonly evidenceIds: readonly string[];
  readonly claims: {
    readonly borrowCheckerClaim: false;
    readonly ownershipSoundnessClaim: false;
    readonly lifetimeSoundnessClaim: false;
    readonly aliasSafetyClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalBorrowCheckerConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly sourceGraph?: Partial<SemanticResourceGraph>;
  readonly sourceResourceGraph?: Partial<SemanticResourceGraph>;
  readonly sourceGraphs?: readonly Partial<SemanticResourceGraph>[];
  readonly targetGraph?: Partial<SemanticResourceGraph>;
  readonly targetResourceGraph?: Partial<SemanticResourceGraph>;
  readonly targetGraphs?: readonly Partial<SemanticResourceGraph>[];
  readonly resourceTransfer?: UniversalResourceTransferInput | UniversalResourceTransferEvidence;
  readonly translationResourceTransfer?: UniversalResourceTransferInput | UniversalResourceTransferEvidence;
  readonly ownershipConstraint?: UniversalOwnershipConstraintEvidence;
  readonly lifetimeConstraint?: UniversalLifetimeConstraintInput | UniversalLifetimeConstraintEvidence;
  readonly translationLifetimeConstraint?: UniversalLifetimeConstraintInput | UniversalLifetimeConstraintEvidence;
  readonly controlFlowConstraint?: UniversalControlFlowConstraintEvidence;
  readonly borrowScopeConstraint?: UniversalBorrowScopeConstraintInput | UniversalBorrowScopeConstraintEvidence;
  readonly translationBorrowScopeConstraint?: UniversalBorrowScopeConstraintInput | UniversalBorrowScopeConstraintEvidence;
  readonly sourceBorrowScopes?: readonly Record<string, unknown>[];
  readonly targetBorrowScopes?: readonly Record<string, unknown>[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalBorrowCheckerConstraintQuery extends UniversalResourceTransferQuery, UniversalOwnershipConstraintQuery, UniversalLifetimeConstraintQuery, UniversalBorrowScopeConstraintQuery {
  readonly borrowCheckerConstraintStatus?: UniversalBorrowCheckerConstraintStatus | string | readonly string[];
  readonly borrowCheckerConstraintAction?: UniversalBorrowCheckerConstraintAction | string | readonly string[];
  readonly borrowCheckerConstraintRequiredFamily?: string | readonly string[];
  readonly borrowCheckerConstraintMissingFamily?: string | readonly string[];
  readonly borrowCheckerConstraintRequiredKind?: string | readonly string[];
  readonly borrowCheckerConstraintRepresentedKind?: string | readonly string[];
  readonly borrowCheckerConstraintMissingKind?: string | readonly string[];
  readonly borrowCheckerConstraintMissingEvidence?: string | readonly string[];
  readonly borrowCheckerConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalBorrowCheckerConstraintStatuses: readonly UniversalBorrowCheckerConstraintStatus[];
export declare function createUniversalBorrowCheckerConstraintEvidence(input?: UniversalBorrowCheckerConstraintInput): UniversalBorrowCheckerConstraintEvidence;
export declare function borrowCheckerConstraintMatches(evidence?: Partial<UniversalBorrowCheckerConstraintEvidence>, query?: UniversalBorrowCheckerConstraintQuery): boolean;
