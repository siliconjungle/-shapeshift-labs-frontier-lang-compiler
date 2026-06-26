export type JsTsProjectSafeMergeRecommendedAction = 'apply' | 'review' | 'block' | string;

export interface JsTsProjectSafeMergeMissingEvidenceRoute {
  readonly id: string;
  readonly lane: string;
  readonly next: string;
}

export interface JsTsProjectSafeMergeMissingEvidenceTelemetry {
  readonly total: number;
  readonly byScope: Readonly<Record<string, number>>;
  readonly byKind: Readonly<Record<string, number>>;
  readonly byStatus: Readonly<Record<string, number>>;
  readonly byAction: Readonly<Record<string, number>>;
  readonly byRoute: Readonly<Record<string, number>>;
  readonly byLane: Readonly<Record<string, number>>;
}

export interface JsTsProjectSafeMergeMissingEvidence {
  readonly code: string;
  readonly kind: string;
  readonly scope: string;
  readonly status: 'missing' | string;
  readonly action: 'review' | string;
  readonly proofLevel?: string;
  readonly route?: JsTsProjectSafeMergeMissingEvidenceRoute;
  readonly routeId?: string;
  readonly routeLane?: string;
  readonly routeNext?: string;
  readonly relatedSignals?: readonly string[];
  readonly summary?: string;
  readonly suggestedInput?: Record<string, unknown>;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export type JsTsProjectSafeMergeAdmissionMatrixSurface = Record<string, unknown> & { readonly surface: string; readonly proofStatuses: Readonly<Record<string, string>>; readonly missingRouteIds?: readonly string[]; readonly nextMissingRouteId?: string };

export type JsTsProjectSafeMergeAdmissionMatrixAudit = Record<string, unknown> & { readonly kind: 'frontier.lang.jsTsProjectMergeAdmissionMatrixAudit'; readonly surfaces: readonly JsTsProjectSafeMergeAdmissionMatrixSurface[] };

export interface JsTsProjectSafeMergeConfidenceSummary {
  readonly kind: 'frontier.lang.jsTsProjectMergeConfidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.jsTsProjectMergeConfidence.v1';
  readonly id: string;
  readonly score: number;
  readonly level: string;
  readonly higherIsBetter: true;
  readonly reviewRequired: boolean;
  readonly autoApplyCandidate: boolean;
  readonly recommendedAction: JsTsProjectSafeMergeRecommendedAction;
  readonly reviewRecommended: boolean;
  readonly blockRecommended: boolean;
  readonly autoApplyEvidenceComplete: boolean;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: boolean;
  readonly evidenceIds: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly missingSignals: readonly string[];
  readonly nextMissingSignal?: string;
  readonly nextMissingEvidence?: JsTsProjectSafeMergeMissingEvidence;
  readonly missingEvidence: readonly JsTsProjectSafeMergeMissingEvidence[];
  readonly missingEvidenceMatrix: JsTsProjectSafeMergeMissingEvidenceTelemetry;
  readonly routingCalibration: Record<string, unknown>;
  readonly admissionMatrixAudit: JsTsProjectSafeMergeAdmissionMatrixAudit;
  readonly dimensions: Readonly<Record<string, string>>;
  readonly signals: Readonly<Record<string, number>>;
}
