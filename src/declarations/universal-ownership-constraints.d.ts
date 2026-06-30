import type { FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { SemanticResourceGraph, SemanticResourceGraphSummary } from './semantic-resource-graph.js';

export type UniversalOwnershipConstraintStatus =
  | 'not-applicable'
  | 'satisfied'
  | 'degraded'
  | 'needs-evidence'
  | 'blocked';

export type UniversalOwnershipConstraintAction =
  | 'skip'
  | 'attach-ownership-constraint-record'
  | 'review-ownership-constraint-loss'
  | 'collect-ownership-constraint-evidence'
  | 'reject';

export interface UniversalOwnershipConstraintModel {
  readonly ownerKinds: readonly string[];
  readonly loanModes: readonly string[];
  readonly aliasKinds: readonly string[];
  readonly moveKinds: readonly string[];
  readonly dropKinds: readonly string[];
  readonly lifetimeKinds: readonly string[];
  readonly unsafeBoundaryKinds: readonly string[];
  readonly hasSharedBorrow: boolean;
  readonly hasExclusiveBorrow: boolean;
  readonly hasRawAccess: boolean;
  readonly hasLifetimeBoundLoans: boolean;
}

export interface UniversalOwnershipConstraintSide {
  readonly role: 'source' | 'target';
  readonly graphId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly status?: string;
  readonly summary: SemanticResourceGraphSummary;
  readonly model: UniversalOwnershipConstraintModel;
}

export interface UniversalOwnershipConstraintRecord {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly source: readonly string[];
  readonly target: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalOwnershipConstraintEvidence {
  readonly kind: 'frontier.lang.universalOwnershipConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalOwnershipConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalOwnershipConstraintStatus;
  readonly action: UniversalOwnershipConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly source: UniversalOwnershipConstraintSide;
  readonly targetSide: UniversalOwnershipConstraintSide;
  readonly constraints: readonly UniversalOwnershipConstraintRecord[];
  readonly claims: {
    readonly borrowCheckerClaim: false;
    readonly aliasSafetyClaim: false;
    readonly lifetimeSoundnessClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalOwnershipConstraintInput {
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
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalOwnershipConstraintQuery {
  readonly ownershipConstraintStatus?: UniversalOwnershipConstraintStatus | string | readonly string[];
  readonly ownershipConstraintAction?: UniversalOwnershipConstraintAction | string | readonly string[];
  readonly ownershipConstraintRequiredKind?: string | readonly string[];
  readonly ownershipConstraintRepresentedKind?: string | readonly string[];
  readonly ownershipConstraintMissingKind?: string | readonly string[];
  readonly ownershipConstraintMissingEvidence?: string | readonly string[];
  readonly ownershipConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalOwnershipConstraintStatuses: readonly UniversalOwnershipConstraintStatus[];
export declare function createUniversalOwnershipConstraintEvidence(input?: UniversalOwnershipConstraintInput): UniversalOwnershipConstraintEvidence;
export declare function ownershipConstraintMatches(evidence?: Partial<UniversalOwnershipConstraintEvidence>, query?: UniversalOwnershipConstraintQuery): boolean;
