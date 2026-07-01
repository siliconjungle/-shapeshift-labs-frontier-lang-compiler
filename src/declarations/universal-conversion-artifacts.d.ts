import type {
  FrontierSourceLanguage,
  SemanticOperationSet,
  SemanticMergeReadiness
} from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { SemanticHistoryRecord } from './semantic-history.js';
import type { SemanticPatchBundleRecord } from './semantic-patch-bundle.js';
import type { UniversalConversionArtifactCompactCounts } from './universal-conversion-compact-counts.js';
import type { UniversalConversionRouteEvidenceReceipt } from './universal-conversion-route-evidence.js';
import type { UniversalConversionRuntimeRouteFields } from './universal-conversion-artifact-runtime-routes.js';
import type { UniversalInterlinguaConstraintEdgeKind, UniversalInterlinguaLayerKind, UniversalInterlinguaLoweringDisposition, UniversalInterlinguaRecord } from './universal-interlingua.js';
import type { UniversalConversionRouteConstraintFields } from './universal-conversion-plan-constraints.js';
import type {
  UniversalConversionAdmissionAction,
  UniversalConversionPlan,
  UniversalConversionPlanOptions,
  UniversalConversionPriority,
  UniversalConversionRoute,
  UniversalConversionRouteAction,
  UniversalConversionRouteMode,
  UniversalTranslationAdmission, UniversalTranslationAdmissionAction, UniversalTranslationAdmissionStatus,
  UniversalConversionMergeScore,
  UniversalConversionRisk
} from './universal-conversion-plan.js';
import type { UniversalConversionArtifactIndex, UniversalConversionArtifactQuery, UniversalConversionSemanticEditIndexKey, UniversalConversionSemanticEditMetricKey } from './universal-conversion-artifact-query.js';
import type { UniversalRuntimeCapabilityKind, UniversalRuntimeProofSignalKind } from './universal-runtime-capabilities.js';

export type { UniversalConversionArtifactIndex, UniversalConversionArtifactQuery, UniversalConversionSemanticEditIndexKey, UniversalConversionSemanticEditMetricKey } from './universal-conversion-artifact-query.js';

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
  readonly sourceMapIds: readonly string[]; readonly sourceMapMappingIds: readonly string[]; readonly sourceMapLinkIds: readonly string[];
  readonly semanticOperationIds: readonly string[];
  readonly evidenceReceiptIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly proofIds: readonly string[];
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}
export interface UniversalConversionConstraintSummary {
  readonly id?: string; readonly status?: string; readonly action?: string;
  readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[];
}

export interface UniversalConversionAdmissionRecord extends UniversalConversionRuntimeRouteFields {
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
  readonly translationAdmissionStatus?: UniversalTranslationAdmissionStatus; readonly translationAdmissionAction?: UniversalTranslationAdmissionAction; readonly reviewRequired: true;
  readonly interlinguaRecordId?: string;
  readonly interlinguaLoweringDisposition?: UniversalInterlinguaLoweringDisposition;
  readonly interlinguaConstraintFamilies: readonly UniversalInterlinguaConstraintEdgeKind[]; readonly interlinguaConstraintStatuses: readonly string[]; readonly interlinguaConstraintActions: readonly string[]; readonly interlinguaConstraintSourceIds: readonly string[]; readonly interlinguaConstraintEvidenceIds: readonly string[];
  readonly interlinguaConstraintRequiredKinds: readonly string[]; readonly interlinguaConstraintRepresentedKinds: readonly string[]; readonly interlinguaConstraintMissingKinds: readonly string[]; readonly interlinguaConstraintMissingEvidence: readonly string[];
  readonly interlinguaConstraintObligationKinds: readonly string[]; readonly interlinguaConstraintObligationStatuses: readonly string[]; readonly interlinguaConstraintObligationEvidenceIds: readonly string[]; readonly interlinguaConstraintObligationMissingEvidence: readonly string[];
  readonly resourceTransferStatus?: string;
  readonly resourceTransferAction?: string;
  readonly runtimeProofObligationIds: readonly string[]; readonly runtimeProofCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly runtimeProofStatuses: readonly string[]; readonly runtimeProofRequiredSignals: readonly UniversalRuntimeProofSignalKind[];
  readonly runtimeProofProvidedSignals: readonly UniversalRuntimeProofSignalKind[]; readonly runtimeProofMissingSignals: readonly UniversalRuntimeProofSignalKind[];
  readonly lifetimeConstraintStatus?: string;
  readonly lifetimeConstraintAction?: string;
  readonly controlFlowConstraintStatus?: string; readonly controlFlowConstraintAction?: string;
  readonly callableBoundaryConstraintStatus?: string; readonly callableBoundaryConstraintAction?: string;
  readonly adtPatternConstraintStatus?: string; readonly adtPatternConstraintAction?: string;
  readonly borrowScopeConstraintStatus?: string;
  readonly borrowScopeConstraintAction?: string;
  readonly borrowCheckerConstraintStatus?: string;
  readonly borrowCheckerConstraintAction?: string; readonly dataLayoutConstraintStatus?: string; readonly dataLayoutConstraintAction?: string;
  readonly effectConstraintStatus?: string;
  readonly effectConstraintAction?: string;
  readonly concurrencyModelConstraintStatus?: string; readonly concurrencyModelConstraintAction?: string;
  readonly errorModelConstraintStatus?: string; readonly errorModelConstraintAction?: string;
  readonly evaluationModelConstraintStatus?: string; readonly evaluationModelConstraintAction?: string; readonly hostEnvironmentConstraintStatus?: string; readonly hostEnvironmentConstraintAction?: string;
  readonly memoryModelConstraintStatus?: string;
  readonly memoryModelConstraintAction?: string; readonly metaprogrammingConstraintStatus?: string; readonly metaprogrammingConstraintAction?: string; readonly scopeBindingConstraintStatus?: string; readonly scopeBindingConstraintAction?: string;
  readonly moduleConstraintStatus?: string; readonly numericSemanticsConstraintStatus?: string; readonly textSemanticsConstraintStatus?: string; readonly collectionSemanticsConstraintStatus?: string; readonly serializationSemanticsConstraintStatus?: string; readonly dependencySemanticsConstraintStatus?: string; readonly objectModelConstraintStatus?: string; readonly protocolConstraintStatus?: string;
  readonly moduleConstraintAction?: string; readonly numericSemanticsConstraintAction?: string; readonly textSemanticsConstraintAction?: string; readonly collectionSemanticsConstraintAction?: string; readonly serializationSemanticsConstraintAction?: string; readonly dependencySemanticsConstraintAction?: string; readonly objectModelConstraintAction?: string; readonly protocolConstraintAction?: string;
  readonly typeConstraintStatus?: string; readonly typeConstraintAction?: string;
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
    readonly sourceMapIds: readonly string[]; readonly sourceMapMappingIds: readonly string[]; readonly sourceMapLinkIds: readonly string[];
    readonly runtimeRouteId?: string; readonly sourceHostId?: string; readonly targetHostId?: string;
    readonly runtimeProofObligationIds: readonly string[];
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
  readonly interlingua: {
    readonly id?: string;
    readonly loweringDisposition?: UniversalInterlinguaLoweringDisposition;
    readonly representedLayerKinds: readonly UniversalInterlinguaLayerKind[]; readonly missingLayerKinds: readonly UniversalInterlinguaLayerKind[]; readonly reviewLayerKinds: readonly UniversalInterlinguaLayerKind[]; readonly blockedLayerKinds: readonly UniversalInterlinguaLayerKind[];
    readonly constraintFamilies: readonly UniversalInterlinguaConstraintEdgeKind[]; readonly constraintStatuses: readonly string[]; readonly constraintActions: readonly string[]; readonly constraintSourceIds: readonly string[]; readonly constraintEvidenceIds: readonly string[];
    readonly constraintRequiredKinds: readonly string[]; readonly constraintRepresentedKinds: readonly string[]; readonly constraintMissingKinds: readonly string[]; readonly constraintMissingEvidence: readonly string[];
    readonly constraintObligationKinds: readonly string[]; readonly constraintObligationStatuses: readonly string[]; readonly constraintObligationEvidenceIds: readonly string[]; readonly constraintObligationMissingEvidence: readonly string[];
    readonly lossIds: readonly string[];
    readonly missingEvidence: readonly string[];
  };
  readonly resourceTransfer: {
    readonly id?: string;
    readonly status?: string;
    readonly action?: string;
    readonly requiredKinds: readonly string[];
    readonly representedKinds: readonly string[];
    readonly missingKinds: readonly string[];
    readonly missingEvidence: readonly string[];
    readonly losses: readonly string[];
    readonly ownershipConstraints: {
      readonly id?: string;
      readonly status?: string;
      readonly action?: string;
      readonly requiredKinds: readonly string[];
      readonly representedKinds: readonly string[];
      readonly missingKinds: readonly string[];
      readonly missingEvidence: readonly string[];
    };
  };
  readonly effectConstraint: UniversalConversionConstraintSummary; readonly concurrencyModelConstraint: UniversalConversionConstraintSummary;
  readonly lifetimeConstraint: UniversalConversionConstraintSummary;
  readonly controlFlowConstraint: UniversalConversionConstraintSummary; readonly adtPatternConstraint: UniversalConversionConstraintSummary;
  readonly callableBoundaryConstraint: UniversalConversionConstraintSummary;
  readonly borrowScopeConstraint: UniversalConversionConstraintSummary;
  readonly borrowCheckerConstraint: UniversalConversionConstraintSummary; readonly dataLayoutConstraint: UniversalConversionConstraintSummary;
  readonly moduleConstraint: UniversalConversionConstraintSummary;
  readonly numericSemanticsConstraint: UniversalConversionConstraintSummary; readonly textSemanticsConstraint: UniversalConversionConstraintSummary; readonly collectionSemanticsConstraint: UniversalConversionConstraintSummary; readonly serializationSemanticsConstraint: UniversalConversionConstraintSummary; readonly dependencySemanticsConstraint: UniversalConversionConstraintSummary;
  readonly errorModelConstraint: UniversalConversionConstraintSummary;
  readonly evaluationModelConstraint: UniversalConversionConstraintSummary; readonly hostEnvironmentConstraint: UniversalConversionConstraintSummary;
  readonly memoryModelConstraint: UniversalConversionConstraintSummary; readonly metaprogrammingConstraint: UniversalConversionConstraintSummary; readonly scopeBindingConstraint: UniversalConversionConstraintSummary; readonly objectModelConstraint: UniversalConversionConstraintSummary; readonly protocolConstraint: UniversalConversionConstraintSummary; readonly typeConstraint: UniversalConversionConstraintSummary;
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
    readonly runtimeProofObligations: number;
    readonly runtimeProofMissingSignals: readonly UniversalRuntimeProofSignalKind[];
    readonly runtimeProofProvidedSignals: readonly UniversalRuntimeProofSignalKind[];
    readonly missing: readonly string[];
    readonly blockers: readonly string[];
    readonly review: readonly string[];
  };
  readonly reasons: readonly string[];
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly metadata: Record<string, unknown>;
}

export interface UniversalConversionRouteArtifact extends UniversalConversionRouteConstraintFields, UniversalConversionRuntimeRouteFields, Pick<UniversalConversionArtifactIndex, UniversalConversionSemanticEditIndexKey | UniversalConversionSemanticEditMetricKey> {
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
  readonly lossClass?: string;
  readonly adapter?: string;
  readonly adapterKind?: string;
  readonly missingEvidence: readonly string[];
  readonly runtimeAdapterRequirementIds: readonly string[];
  readonly runtimeProofObligationIds: readonly string[];
  readonly runtimeProofCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly runtimeProofStatuses: readonly string[];
  readonly runtimeProofRequiredSignals: readonly UniversalRuntimeProofSignalKind[];
  readonly runtimeProofProvidedSignals: readonly UniversalRuntimeProofSignalKind[];
  readonly runtimeProofMissingSignals: readonly UniversalRuntimeProofSignalKind[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly admissionAction: UniversalConversionAdmissionAction;
  readonly translationAdmission?: UniversalTranslationAdmission;
  readonly interlingua?: UniversalInterlinguaRecord;
  readonly admissionStatus: UniversalConversionArtifactAdmissionStatus;
  readonly reviewRequired: true;
  readonly history: SemanticHistoryRecord;
  readonly patchBundle: SemanticPatchBundleRecord;
  readonly admissionRecord: UniversalConversionAdmissionRecord;
  readonly evidenceReceipt: UniversalConversionRouteEvidenceReceipt;
  readonly semanticOperations: SemanticOperationSet;
  readonly materialization: UniversalConversionArtifactMaterialization;
  readonly mergeScore?: UniversalConversionMergeScore;
  readonly admissionBucket: UniversalConversionArtifactAdmissionBucket;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly metadata: Record<string, unknown>;
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
  readonly evidenceReceipts: readonly UniversalConversionRouteEvidenceReceipt[];
  readonly index: UniversalConversionArtifactIndex;
  readonly summary: {
    readonly routes: number;
    readonly histories: number;
    readonly patchBundles: number;
    readonly admissionRecords: number;
    readonly evidenceReceipts: number;
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
    readonly receiptBoundEvidence: number;
    readonly receiptRejectedEvidence: number;
    readonly receiptProofEvidence: number;
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
  readonly evidence?: readonly Record<string, unknown>[];
  readonly metadata?: Record<string, unknown>;
}

export type CreateUniversalConversionArtifactsInput =
  | UniversalConversionPlan
  | UniversalConversionRoute
  | UniversalConversionPlanOptions;

export declare function createUniversalConversionArtifacts(
  input?: CreateUniversalConversionArtifactsInput,
  options?: CreateUniversalConversionArtifactsOptions
): UniversalConversionArtifacts;
export declare function queryUniversalConversionArtifacts(
  records: UniversalConversionArtifacts | UniversalConversionRouteArtifact | readonly (UniversalConversionArtifacts | UniversalConversionRouteArtifact)[],
  query?: UniversalConversionArtifactQuery
): readonly UniversalConversionRouteArtifact[];
