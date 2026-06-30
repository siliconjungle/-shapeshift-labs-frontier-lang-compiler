import type { FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { SemanticResourceGraph, SemanticResourceGraphSummary } from './semantic-resource-graph.js';

export type UniversalResourceTransferStatus =
  | 'not-applicable'
  | 'preserved'
  | 'degraded'
  | 'needs-evidence'
  | 'blocked';

export type UniversalResourceTransferAction =
  | 'skip'
  | 'attach-resource-transfer-record'
  | 'review-resource-transfer-loss'
  | 'collect-resource-transfer-evidence'
  | 'reject';

export interface UniversalResourceTransferSide {
  readonly role: 'source' | 'target';
  readonly graphId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly status?: string;
  readonly summary: SemanticResourceGraphSummary;
  readonly features: {
    readonly resourceKinds: readonly string[];
    readonly loanModes: readonly string[];
    readonly aliasKinds: readonly string[];
    readonly moveKinds: readonly string[];
    readonly dropKinds: readonly string[];
    readonly lifetimeKinds: readonly string[];
    readonly unsafeBoundaryKinds: readonly string[];
  };
}

export interface UniversalResourceTransferLoss {
  readonly kind: string;
  readonly source: readonly string[];
  readonly target: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalResourceTransferEvidence {
  readonly kind: 'frontier.lang.universalResourceTransferEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalResourceTransferEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalResourceTransferStatus;
  readonly action: UniversalResourceTransferAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly source: UniversalResourceTransferSide;
  readonly targetSide: UniversalResourceTransferSide;
  readonly losses: readonly UniversalResourceTransferLoss[];
  readonly claims: {
    readonly resourceEquivalenceClaim: false;
    readonly borrowCheckerClaim: false;
    readonly aliasSafetyClaim: false;
    readonly lifetimeSoundnessClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalResourceTransferInput {
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

export interface UniversalResourceTransferQuery {
  readonly resourceTransferStatus?: UniversalResourceTransferStatus | string | readonly string[];
  readonly resourceTransferAction?: UniversalResourceTransferAction | string | readonly string[];
  readonly resourceTransferMissingEvidence?: string | readonly string[];
  readonly resourceTransferRequiredKind?: string | readonly string[];
  readonly resourceTransferRepresentedKind?: string | readonly string[];
  readonly resourceTransferMissingKind?: string | readonly string[];
  readonly resourceTransferLossKind?: string | readonly string[];
  readonly resourceTransferEvidenceId?: string | readonly string[];
}

export declare const UniversalResourceTransferStatuses: readonly UniversalResourceTransferStatus[];
export declare function createUniversalResourceTransferEvidence(input?: UniversalResourceTransferInput): UniversalResourceTransferEvidence;
export declare function resourceTransferMatches(transfer?: Partial<UniversalResourceTransferEvidence>, query?: UniversalResourceTransferQuery): boolean;
