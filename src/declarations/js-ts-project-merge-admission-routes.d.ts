export interface JsTsProjectSafeMergeAdmissionRoute {
  readonly kind: 'frontier.lang.jsTsProjectMergeAdmissionRoute';
  readonly version: 1;
  readonly routeId: string;
  readonly routeKind?: 'apply' | 'review' | 'rerun' | 'reject' | 'rebase' | 'block' | string;
  readonly routeLane?: string;
  readonly routeNext?: string;
  readonly action?: string;
  readonly status?: string;
  readonly source?: string;
  readonly subjectKind?: string;
  readonly branch?: string;
  readonly sourcePath?: string;
  readonly sourcePaths?: readonly string[];
  readonly proofLevel?: string;
  readonly evidenceId?: string;
  readonly conflictKey?: string;
  readonly reasonCodes?: readonly string[];
  readonly requiredEvidence?: readonly string[];
  readonly presentEvidence?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly details?: Record<string, unknown>;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface JsTsProjectSafeMergeAdmissionRouteSummary {
  readonly total: number;
  readonly byKind?: Readonly<Record<string, number>>;
  readonly byAction?: Readonly<Record<string, number>>;
  readonly byLane?: Readonly<Record<string, number>>;
  readonly byStatus?: Readonly<Record<string, number>>;
  readonly byRoute?: Readonly<Record<string, number>>;
  readonly nextRoute?: JsTsProjectSafeMergeAdmissionRoute;
}
