import type {
  FrontierSourceLanguage,
  SemanticOperationSet,
  SemanticMergeReadiness
} from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { SemanticHistoryRecord } from './semantic-history.js';
import type { SemanticPatchBundleRecord } from './semantic-patch-bundle.js';
import type { UniversalConversionArtifactCompactCounts } from './universal-conversion-compact-counts.js';
import type {
  UniversalConversionAdmissionAction,
  UniversalConversionPlan,
  UniversalConversionPlanOptions,
  UniversalConversionPriority,
  UniversalConversionRoute,
  UniversalConversionRouteAction,
  UniversalConversionRouteMode,
  UniversalConversionMergeScore,
  UniversalConversionRisk
} from './universal-conversion-plan.js';
import type { UniversalRepresentationCoverageQuery } from './universal-representation-coverage.js';

export type UniversalConversionArtifactAdmissionStatus = 'queued' | 'needs-review' | 'blocked' | string;
export type UniversalConversionArtifactAdmissionBucket =
  | 'merge-ready'
  | 'needs-evidence'
  | 'needs-adapter'
  | 'needs-review'
  | 'blocked'
  | string;
export type UniversalConversionArtifactMaterializationStatus = 'materialized' | 'planned-only' | 'missing' | 'failed' | string;

export interface UniversalConversionArtifactMaterialization {
  readonly status: UniversalConversionArtifactMaterializationStatus;
  readonly plannedHistoryIds: readonly string[];
  readonly materializedHistoryIds: readonly string[];
  readonly patchBundleIds: readonly string[];
  readonly sourceMapLinkIds: readonly string[];
  readonly semanticOperationIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly proofIds: readonly string[];
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface UniversalConversionAdmissionRecord {
  readonly kind: 'frontier.lang.universalConversionAdmissionRecord';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalConversionAdmissionRecord.v1';
  readonly id: string;
  readonly routeId: string;
  readonly planId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode: UniversalConversionRouteMode;
  readonly routeAction: UniversalConversionRouteAction;
  readonly admissionStatus: UniversalConversionArtifactAdmissionStatus;
  readonly admissionAction: UniversalConversionAdmissionAction;
  readonly admissionBucket: UniversalConversionArtifactAdmissionBucket;
  readonly reviewRequired: true;
  readonly readiness: SemanticMergeReadiness | string;
  readonly risk: UniversalConversionRisk | string;
  readonly score: {
    readonly value: number;
    readonly uncappedValue: number;
    readonly sortKey: number;
    readonly higherIsBetter: true;
    readonly componentStatuses: Record<string, string>;
    readonly penalties: readonly string[];
  };
  readonly ids: {
    readonly historyId?: string;
    readonly patchBundleId?: string;
    readonly semanticOperationIds: readonly string[];
    readonly sourceMapLinkIds: readonly string[];
    readonly evidenceIds: readonly string[];
    readonly proofIds: readonly string[];
  };
  readonly semanticOperations: {
    readonly total: number;
    readonly byKind: Record<string, number>;
    readonly kinds: readonly string[];
    readonly dynamic: readonly string[];
    readonly opaque: readonly string[];
  };
  readonly ownership: {
    readonly keys: readonly string[];
    readonly conflictKeys: readonly string[];
  };
  readonly source: {
    readonly paths: readonly string[];
    readonly hashes: readonly string[];
    readonly baseHashes: readonly string[];
    readonly targetHashes: readonly string[];
  };
  readonly evidence: {
    readonly total: number;
    readonly proofArtifacts: number;
    readonly missing: readonly string[];
    readonly blockers: readonly string[];
    readonly review: readonly string[];
  };
  readonly reasons: readonly string[];
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly metadata: Record<string, unknown>;
}

export interface UniversalConversionRouteArtifact {
  readonly kind: 'frontier.lang.universalConversionRouteArtifact';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalConversionRouteArtifact.v1';
  readonly routeId: string;
  readonly planId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode: UniversalConversionRouteMode;
  readonly routeAction: UniversalConversionRouteAction;
  readonly priority: UniversalConversionPriority;
  readonly readiness: SemanticMergeReadiness | string;
  readonly admissionAction: UniversalConversionAdmissionAction;
  readonly admissionStatus: UniversalConversionArtifactAdmissionStatus;
  readonly reviewRequired: true;
  readonly history: SemanticHistoryRecord;
  readonly patchBundle: SemanticPatchBundleRecord;
  readonly admissionRecord: UniversalConversionAdmissionRecord;
  readonly semanticOperations: SemanticOperationSet;
  readonly materialization: UniversalConversionArtifactMaterialization;
  readonly mergeScore?: UniversalConversionMergeScore;
  readonly admissionBucket: UniversalConversionArtifactAdmissionBucket;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly metadata: Record<string, unknown>;
}

export interface UniversalConversionArtifactIndex {
  readonly routeIds: readonly string[];
  readonly historyIds: readonly string[];
  readonly patchBundleIds: readonly string[];
  readonly admissionRecordIds: readonly string[];
  readonly languages: readonly string[];
  readonly targets: readonly string[];
  readonly modes: readonly string[];
  readonly readinesses: readonly string[];
  readonly admissionStatuses: readonly string[];
  readonly admissionBuckets: readonly string[];
  readonly admissionRisks: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly sourceHashes: readonly string[];
  readonly ownershipKeys: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly proofIds: readonly string[];
  readonly semanticOperationIds: readonly string[];
  readonly semanticOperationKinds: readonly string[];
  readonly semanticEditStatuses: readonly string[];
  readonly semanticEditScriptIds: readonly string[];
  readonly semanticEditProjectionIds: readonly string[];
  readonly semanticEditReplayIds: readonly string[];
  readonly semanticEditReplayStatuses: readonly string[];
  readonly semanticEditReplayActions: readonly string[];
  readonly semanticEditAdmissionStatuses: readonly string[];
  readonly semanticEditAdmissionActions: readonly string[];
  readonly semanticEditAdmissionReadinesses: readonly string[];
  readonly semanticEditReplayCurrentHashes: readonly string[];
  readonly semanticEditReplayOutputHashes: readonly string[];
  readonly semanticEditKeys: readonly string[];
  readonly semanticEditHashes: readonly string[];
  readonly semanticIdentityHashes: readonly string[];
  readonly sourceIdentityHashes: readonly string[];
  readonly operationContentHashes: readonly string[];
  readonly editContentHashes: readonly string[];
  readonly representationConstructKinds: readonly string[];
  readonly runtimeCapabilities: readonly string[];
  readonly sourceMapPrecisions: readonly string[];
  readonly transformIdentityHashes: readonly string[];
}

export interface UniversalConversionArtifacts {
  readonly kind: 'frontier.lang.universalConversionArtifacts';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalConversionArtifacts.v1';
  readonly id: string;
  readonly planId?: string;
  readonly generatedAt: number | string;
  readonly routeArtifacts: readonly UniversalConversionRouteArtifact[];
  readonly historyRecords: readonly SemanticHistoryRecord[];
  readonly patchBundleRecords: readonly SemanticPatchBundleRecord[];
  readonly admissionRecords: readonly UniversalConversionAdmissionRecord[];
  readonly index: UniversalConversionArtifactIndex;
  readonly summary: {
    readonly routes: number;
    readonly histories: number;
    readonly patchBundles: number;
    readonly admissionRecords: number;
    readonly semanticOperations: number;
    readonly compactCounts: UniversalConversionArtifactCompactCounts;
    readonly mergeReady: number;
    readonly needsEvidence: number;
    readonly needsAdapter: number;
    readonly needsReview: number;
    readonly admissionBlocked: number;
    readonly lowRisk: number;
    readonly mediumRisk: number;
    readonly highRisk: number;
    readonly queued: number;
    readonly reviewRequired: number;
    readonly blocked: number;
    readonly reasonCodes: number;
    readonly missingEvidence: number;
    readonly blockers: number;
    readonly reviewReasons: number;
    readonly evidenceIds: number;
    readonly proofIds: number;
    readonly autoMergeClaims: 0;
    readonly semanticEquivalenceClaims: 0;
  };
  readonly metadata: {
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly note: string;
  } & Record<string, unknown>;
}

export interface CreateUniversalConversionArtifactsOptions {
  readonly id?: string;
  readonly planId?: string;
  readonly generatedAt?: number | string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: UniversalConversionRouteMode;
  readonly readiness?: SemanticMergeReadiness | string;
  readonly admissionAction?: UniversalConversionAdmissionAction;
  readonly maxRoutes?: number;
  readonly metadata?: Record<string, unknown>;
}

export type CreateUniversalConversionArtifactsInput =
  | UniversalConversionPlan
  | UniversalConversionRoute
  | UniversalConversionPlanOptions;

export interface UniversalConversionArtifactQuery extends UniversalRepresentationCoverageQuery {
  readonly routeId?: string | readonly string[];
  readonly historyId?: string | readonly string[];
  readonly patchBundleId?: string | readonly string[];
  readonly admissionRecordId?: string | readonly string[];
  readonly sourceLanguage?: FrontierSourceLanguage | string | readonly string[];
  readonly target?: FrontierCompileTarget | string | readonly string[];
  readonly mode?: UniversalConversionRouteMode | readonly string[];
  readonly readiness?: SemanticMergeReadiness | string | readonly string[];
  readonly admissionAction?: UniversalConversionAdmissionAction | readonly string[];
  readonly admissionStatus?: UniversalConversionArtifactAdmissionStatus | readonly string[];
  readonly admissionBucket?: UniversalConversionArtifactAdmissionBucket | readonly string[];
  readonly risk?: UniversalConversionRisk | string | readonly string[];
  readonly priority?: UniversalConversionPriority | readonly string[];
  readonly routeAction?: UniversalConversionRouteAction | readonly string[];
  readonly sourcePath?: string | readonly string[];
  readonly sourceHash?: string | readonly string[];
  readonly ownershipKey?: string | readonly string[];
  readonly conflictKey?: string | readonly string[];
  readonly evidenceId?: string | readonly string[];
  readonly proofId?: string | readonly string[];
  readonly semanticOperationId?: string | readonly string[];
  readonly semanticOperationKind?: string | readonly string[];
  readonly semanticEditStatus?: string | readonly string[];
  readonly semanticEditStatuses?: readonly string[];
  readonly semanticEditScriptId?: string | readonly string[];
  readonly semanticEditScriptIds?: readonly string[];
  readonly semanticEditProjectionId?: string | readonly string[];
  readonly semanticEditProjectionIds?: readonly string[];
  readonly semanticEditReplayId?: string | readonly string[];
  readonly semanticEditReplayIds?: readonly string[];
  readonly semanticEditReplayStatus?: string | readonly string[];
  readonly semanticEditReplayStatuses?: readonly string[];
  readonly semanticEditReplayAction?: string | readonly string[];
  readonly semanticEditReplayActions?: readonly string[];
  readonly semanticEditAdmission?: string | readonly string[];
  readonly semanticEditAdmissionStatus?: string | readonly string[];
  readonly semanticEditAdmissionStatuses?: readonly string[];
  readonly semanticEditAdmissionAction?: string | readonly string[];
  readonly semanticEditAdmissionActions?: readonly string[];
  readonly semanticEditAdmissionReadiness?: string | readonly string[];
  readonly semanticEditAdmissionReadinesses?: readonly string[];
  readonly semanticEditReplayCurrentHash?: string | readonly string[];
  readonly semanticEditReplayCurrentHashes?: readonly string[];
  readonly semanticEditReplayOutputHash?: string | readonly string[];
  readonly semanticEditReplayOutputHashes?: readonly string[];
  readonly semanticEditKey?: string | readonly string[];
  readonly semanticEditKeys?: readonly string[];
  readonly semanticEditHash?: string | readonly string[];
  readonly semanticEditHashes?: readonly string[];
  readonly semanticIdentityHash?: string | readonly string[];
  readonly semanticIdentityHashes?: readonly string[];
  readonly sourceIdentityHash?: string | readonly string[];
  readonly sourceIdentityHashes?: readonly string[];
  readonly operationContentHash?: string | readonly string[];
  readonly operationContentHashes?: readonly string[];
  readonly editContentHash?: string | readonly string[];
  readonly editContentHashes?: readonly string[];
  readonly representationConstructKind?: string | readonly string[];
}

export declare function createUniversalConversionArtifacts(
  input?: CreateUniversalConversionArtifactsInput,
  options?: CreateUniversalConversionArtifactsOptions
): UniversalConversionArtifacts;
export declare function queryUniversalConversionArtifacts(
  records: UniversalConversionArtifacts | UniversalConversionRouteArtifact | readonly (UniversalConversionArtifacts | UniversalConversionRouteArtifact)[],
  query?: UniversalConversionArtifactQuery
): readonly UniversalConversionRouteArtifact[];
