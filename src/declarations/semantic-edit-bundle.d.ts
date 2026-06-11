import type { SemanticMergeReadiness } from '@shapeshift-labs/frontier-lang-kernel';
import type { SemanticEditProjection, SemanticEditReplay, SemanticEditScript } from './semantic-edit-script.js';

export type SemanticEditBundleAdmissionStatus =
  | 'none'
  | 'ready'
  | 'already-applied'
  | 'needs-review'
  | 'stale'
  | 'conflict'
  | 'blocked'
  | string;

export interface SemanticEditBundleAdmissionSummary {
  readonly scripts: number;
  readonly projections: number;
  readonly replays: number;
  readonly files: number;
  readonly acceptedClean: number;
  readonly alreadyApplied: number;
  readonly conflicts: number;
  readonly stale: number;
  readonly blocked: number;
  readonly needsReview: number;
  readonly projected: number;
  readonly projectionBlocked: number;
  readonly scriptStatuses: readonly string[];
  readonly projectionStatuses: readonly string[];
  readonly replayStatuses: readonly string[];
  readonly replayActions: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly scriptIds: readonly string[];
  readonly projectionIds: readonly string[];
  readonly replayIds: readonly string[];
  readonly reasonCodes: readonly string[];
}

export interface SemanticEditBundleAdmission {
  readonly status: SemanticEditBundleAdmissionStatus;
  readonly action: 'none' | 'admit' | 'skip' | 'review' | 'rerun-semantic-import' | 'block' | string;
  readonly readiness: SemanticMergeReadiness | string;
  readonly reviewRequired: boolean;
  readonly autoApplyCandidate: boolean;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly reasonCodes: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly scriptIds: readonly string[];
  readonly projectionIds: readonly string[];
  readonly replayIds: readonly string[];
  readonly summary: SemanticEditBundleAdmissionSummary;
  readonly metadata?: Record<string, unknown>;
}

export interface CreateSemanticEditBundleAdmissionInput {
  readonly status?: SemanticEditBundleAdmissionStatus;
  readonly action?: string;
  readonly readiness?: SemanticMergeReadiness | string;
  readonly reviewRequired?: boolean;
  readonly autoApplyCandidate?: boolean;
  readonly reasonCodes?: readonly string[] | string;
  readonly semanticEditScript?: SemanticEditScript;
  readonly semanticEditScripts?: readonly SemanticEditScript[] | SemanticEditScript;
  readonly scripts?: readonly SemanticEditScript[] | SemanticEditScript;
  readonly semanticEditProjection?: SemanticEditProjection;
  readonly semanticEditProjections?: readonly SemanticEditProjection[] | SemanticEditProjection;
  readonly projections?: readonly SemanticEditProjection[] | SemanticEditProjection;
  readonly semanticEditReplay?: SemanticEditReplay;
  readonly semanticEditReplays?: readonly SemanticEditReplay[] | SemanticEditReplay;
  readonly replays?: readonly SemanticEditReplay[] | SemanticEditReplay;
  readonly metadata?: Record<string, unknown>;
}

export declare const SemanticEditBundleAdmissionStatuses: readonly SemanticEditBundleAdmissionStatus[];
export declare function createSemanticEditBundleAdmission(
  input?: CreateSemanticEditBundleAdmissionInput,
  options?: Partial<CreateSemanticEditBundleAdmissionInput>
): SemanticEditBundleAdmission;
