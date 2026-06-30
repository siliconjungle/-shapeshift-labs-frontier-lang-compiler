import type { FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { SemanticResourceGraph, SemanticResourceGraphSummary } from './semantic-resource-graph.js';

export type UniversalLifetimeConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalLifetimeConstraintAction = 'skip' | 'attach-lifetime-constraint-record' | 'review-lifetime-constraint-loss' | 'collect-lifetime-constraint-evidence' | 'reject';

export interface UniversalLifetimeRecordInput {
  readonly id?: string;
  readonly kind?: string;
  readonly constraintKind?: string;
  readonly lifetimeKind?: string;
  readonly regionKind?: string;
  readonly predicate?: string;
  readonly resourceId?: string;
  readonly name?: string;
  readonly constraintKinds?: readonly string[];
  readonly factKinds?: readonly string[];
  readonly metadata?: { readonly factKinds?: readonly string[]; readonly [key: string]: unknown };
}

export interface UniversalLifetimeConstraintModel {
  readonly lifetimeKinds: readonly string[];
  readonly loanModes: readonly string[];
  readonly loanRegionIds: readonly string[];
  readonly aliasRegionIds: readonly string[];
  readonly dropRegionIds: readonly string[];
  readonly moveRegionIds: readonly string[];
  readonly outlivesRelations: readonly string[];
  readonly escapeRecords: readonly string[];
  readonly unsafeBoundaryKinds: readonly string[];
  readonly explicitKinds: readonly string[];
  readonly graphKinds: readonly string[];
  readonly combinedKinds: readonly string[];
  readonly hasLifetimeRegion: boolean;
  readonly hasLoanRegions: boolean;
  readonly hasAliasRegions: boolean;
  readonly hasDropRegions: boolean;
  readonly hasMoveRegions: boolean;
  readonly hasOutlives: boolean;
  readonly hasEscapes: boolean;
  readonly hasUnsafeLifetime: boolean;
  readonly hasNonLexicalLifetime: boolean;
  readonly hasReborrowLifetime: boolean;
  readonly hasHigherRankedLifetime: boolean;
  readonly hasVarianceLifetime: boolean;
  readonly hasDropCheckLifetime: boolean;
}

export interface UniversalLifetimeConstraintSide {
  readonly role: 'source' | 'target';
  readonly graphId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly status?: string;
  readonly summary: SemanticResourceGraphSummary;
  readonly model: UniversalLifetimeConstraintModel;
}

export interface UniversalLifetimeConstraintRecord {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly source: readonly string[];
  readonly target: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalLifetimeConstraintEvidence {
  readonly kind: 'frontier.lang.universalLifetimeConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalLifetimeConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalLifetimeConstraintStatus;
  readonly action: UniversalLifetimeConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly source: UniversalLifetimeConstraintSide;
  readonly targetSide: UniversalLifetimeConstraintSide;
  readonly constraints: readonly UniversalLifetimeConstraintRecord[];
  readonly claims: {
    readonly borrowCheckerClaim: false;
    readonly lifetimeSoundnessClaim: false;
    readonly escapeSafetyClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalLifetimeConstraintInput {
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
  readonly sourceLifetimeConstraints?: readonly UniversalLifetimeRecordInput[];
  readonly sourceConstraints?: readonly UniversalLifetimeRecordInput[];
  readonly targetLifetimeConstraints?: readonly UniversalLifetimeRecordInput[];
  readonly targetConstraints?: readonly UniversalLifetimeRecordInput[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalLifetimeConstraintQuery {
  readonly lifetimeConstraintStatus?: UniversalLifetimeConstraintStatus | string | readonly string[];
  readonly lifetimeConstraintAction?: UniversalLifetimeConstraintAction | string | readonly string[];
  readonly lifetimeConstraintRequiredKind?: string | readonly string[];
  readonly lifetimeConstraintRepresentedKind?: string | readonly string[];
  readonly lifetimeConstraintMissingKind?: string | readonly string[];
  readonly lifetimeConstraintMissingEvidence?: string | readonly string[];
  readonly lifetimeConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalLifetimeConstraintStatuses: readonly UniversalLifetimeConstraintStatus[];
export declare function createUniversalLifetimeConstraintEvidence(input?: UniversalLifetimeConstraintInput): UniversalLifetimeConstraintEvidence;
export declare function lifetimeConstraintMatches(evidence?: Partial<UniversalLifetimeConstraintEvidence>, query?: UniversalLifetimeConstraintQuery): boolean;
