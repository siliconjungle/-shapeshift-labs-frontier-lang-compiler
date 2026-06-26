export type JsTsProjectMergeProofLevel =
  | 'syntax-identity'
  | 'source-span-roundtrip'
  | 'semantic-edit-replay-clean'
  | 'parser-roundtrip'
  | 'diagnostics-clean'
  | 'declaration-output-stable'
  | 'focused-test-passed'
  | 'manifest-metadata-validated'
  | 'local-checkout-metadata-proof'
  | 'dependency-install-not-run-default'
  | 'repository-commands-not-run-default'
  | 'semantic-equivalence-external'
  | 'semantic-equivalence-unknown'
  | string;

export type JsTsProjectMergeProofEvidenceStatus = 'evidence-only' | 'review-evidence-missing' | 'failed-evidence' | string;
export type JsTsProjectMergeProofEvidenceRecordStatus = 'passed' | 'failed' | 'skipped' | 'unknown' | string;

export interface JsTsProjectMergeProofMissingEvidence {
  readonly code?: string;
  readonly kind: 'proof-level' | string;
  readonly scope?: string;
  readonly status: 'missing' | 'unknown' | string;
  readonly proofLevel?: JsTsProjectMergeProofLevel;
  readonly action: 'review' | string;
  readonly route?: { readonly id: string; readonly lane: string; readonly next: string };
  readonly routeId?: string;
  readonly routeLane?: string;
  readonly routeNext?: string;
  readonly evidenceId?: string;
  readonly summary?: string;
  readonly nextAction?: string;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface JsTsProjectMergeProofEvidenceRecord {
  readonly id: string;
  readonly kind: 'js-ts-project-merge-proof-evidence';
  readonly level: JsTsProjectMergeProofLevel;
  readonly status: JsTsProjectMergeProofEvidenceRecordStatus;
  readonly scope: string;
  readonly claimKind: 'evidence' | 'semantic-equivalence-upper-bound' | string;
  readonly evidenceOnly: boolean;
  readonly proofClaim: boolean;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: boolean;
  readonly summary: string;
  readonly metadata?: Record<string, unknown> & {
    readonly proofClaim?: boolean;
    readonly autoMergeClaim?: false;
    readonly semanticEquivalenceClaim?: boolean;
    readonly missingSignal?: string;
    readonly nextAction?: string;
  };
}

export interface JsTsProjectMergeProofEvidenceSummary {
  readonly records: number;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly unknown: number;
  readonly evidenceLevels: readonly JsTsProjectMergeProofLevel[];
  readonly passedLevels: readonly JsTsProjectMergeProofLevel[];
  readonly failedLevels: readonly JsTsProjectMergeProofLevel[];
  readonly skippedLevels: readonly JsTsProjectMergeProofLevel[];
  readonly unknownLevels: readonly JsTsProjectMergeProofLevel[];
  readonly missingLevels: readonly JsTsProjectMergeProofLevel[];
  readonly unsupportedSurfaceEvidenceCount?: number;
  readonly unsupportedSurfaceKinds?: readonly string[];
  readonly unsupportedSurfaceReasonCodes?: readonly string[];
  readonly unsupportedSurfaceProofGapRouteIds?: readonly string[];
  readonly unsupportedSurfaceProofGapRouteLanes?: readonly string[];
  readonly unsupportedSurfaceProofGapRouteCounts?: Readonly<Record<string, number>>;
  readonly unsupportedSurfaceProofGapRouteLaneCounts?: Readonly<Record<string, number>>;
  readonly nextUnsupportedSurfaceProofGapRouteId?: string;
  readonly nextUnsupportedSurfaceProofGapRouteLane?: string;
  readonly nextUnsupportedSurfaceProofGapCode?: string;
  readonly missingEvidence: readonly JsTsProjectMergeProofMissingEvidence[];
  readonly nextMissingEvidence?: JsTsProjectMergeProofMissingEvidence;
  readonly semanticEquivalenceLevel: 'semantic-equivalence-unknown' | string;
  readonly semanticEquivalenceClaim: boolean;
  readonly evidenceOnly: true;
  readonly proofClaims: number;
}

export interface JsTsProjectMergeProofEvidence {
  readonly kind: 'frontier.lang.jsTsProjectMergeProofEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.jsTsProjectMergeProofEvidence.v1';
  readonly id: string;
  readonly hash: string;
  readonly status: JsTsProjectMergeProofEvidenceStatus;
  readonly semanticEquivalenceLevel: 'semantic-equivalence-unknown' | string;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: boolean;
  readonly records: readonly JsTsProjectMergeProofEvidenceRecord[];
  readonly summary: JsTsProjectMergeProofEvidenceSummary;
  readonly metadata?: Record<string, unknown> & {
    readonly evidenceOnly?: true;
    readonly proofClaims?: number;
    readonly missingLevels?: readonly JsTsProjectMergeProofLevel[];
    readonly nextMissingEvidence?: JsTsProjectMergeProofMissingEvidence;
    readonly autoMergeClaim?: false;
    readonly semanticEquivalenceClaim?: boolean;
  };
}
