import type {
  FrontierSourceLanguage,
  SemanticMergeReadiness
} from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { SemanticHistoryRecord } from './semantic-history.js';
import type { SemanticPatchBundleRecord } from './semantic-patch-bundle.js';
import type {
  UniversalConversionAdmissionAction,
  UniversalConversionPlan,
  UniversalConversionPlanOptions,
  UniversalConversionPriority,
  UniversalConversionRoute,
  UniversalConversionRouteAction,
  UniversalConversionRouteMode,
  UniversalConversionMergeScore
} from './universal-conversion-plan.js';

export type UniversalConversionArtifactAdmissionStatus = 'queued' | 'needs-review' | 'blocked' | string;
export type UniversalConversionArtifactMaterializationStatus = 'materialized' | 'planned-only' | 'missing' | 'failed' | string;

export interface UniversalConversionArtifactMaterialization {
  readonly status: UniversalConversionArtifactMaterializationStatus;
  readonly plannedHistoryIds: readonly string[];
  readonly materializedHistoryIds: readonly string[];
  readonly patchBundleIds: readonly string[];
  readonly sourceMapLinkIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly proofIds: readonly string[];
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
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
  readonly materialization: UniversalConversionArtifactMaterialization;
  readonly mergeScore?: UniversalConversionMergeScore;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly metadata: Record<string, unknown>;
}

export interface UniversalConversionArtifactIndex {
  readonly routeIds: readonly string[];
  readonly historyIds: readonly string[];
  readonly patchBundleIds: readonly string[];
  readonly languages: readonly string[];
  readonly targets: readonly string[];
  readonly modes: readonly string[];
  readonly readinesses: readonly string[];
  readonly admissionStatuses: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly sourceHashes: readonly string[];
  readonly ownershipKeys: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly proofIds: readonly string[];
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
  readonly index: UniversalConversionArtifactIndex;
  readonly summary: {
    readonly routes: number;
    readonly histories: number;
    readonly patchBundles: number;
    readonly reviewRequired: number;
    readonly blocked: number;
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

export interface UniversalConversionArtifactQuery {
  readonly routeId?: string | readonly string[];
  readonly historyId?: string | readonly string[];
  readonly patchBundleId?: string | readonly string[];
  readonly sourceLanguage?: FrontierSourceLanguage | string | readonly string[];
  readonly target?: FrontierCompileTarget | string | readonly string[];
  readonly mode?: UniversalConversionRouteMode | readonly string[];
  readonly readiness?: SemanticMergeReadiness | string | readonly string[];
  readonly admissionAction?: UniversalConversionAdmissionAction | readonly string[];
  readonly admissionStatus?: UniversalConversionArtifactAdmissionStatus | readonly string[];
  readonly priority?: UniversalConversionPriority | readonly string[];
  readonly routeAction?: UniversalConversionRouteAction | readonly string[];
  readonly sourcePath?: string | readonly string[];
  readonly sourceHash?: string | readonly string[];
  readonly ownershipKey?: string | readonly string[];
  readonly conflictKey?: string | readonly string[];
  readonly evidenceId?: string | readonly string[];
  readonly proofId?: string | readonly string[];
}

export declare function createUniversalConversionArtifacts(
  input?: CreateUniversalConversionArtifactsInput,
  options?: CreateUniversalConversionArtifactsOptions
): UniversalConversionArtifacts;
export declare function queryUniversalConversionArtifacts(
  records: UniversalConversionArtifacts | UniversalConversionRouteArtifact | readonly (UniversalConversionArtifacts | UniversalConversionRouteArtifact)[],
  query?: UniversalConversionArtifactQuery
): readonly UniversalConversionRouteArtifact[];
