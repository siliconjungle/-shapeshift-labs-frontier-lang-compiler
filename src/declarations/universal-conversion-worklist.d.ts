import type { FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type {
  UniversalConversionAdmissionAction,
  UniversalConversionPlan,
  UniversalConversionPlanOptions,
  UniversalConversionPriority,
  UniversalConversionRouteAction,
  UniversalConversionRouteMode
} from './universal-conversion-plan.js';
import type { UniversalInterlinguaConstraintEdgeKind } from './universal-interlingua.js';
import type { UniversalRuntimeCapabilityKind, UniversalRuntimeProofSignalKind } from './universal-runtime-capabilities.js';
import type { UniversalConversionArtifactRuntimeRouteQuery, UniversalConversionWorklistRuntimeRouteFields } from './universal-conversion-artifact-runtime-routes.js';
import type { UniversalConversionArtifactSourceMapQuery, UniversalConversionWorklistSourceMapFields } from './universal-conversion-artifact-source-maps.js';
import type { UniversalConversionArtifactIndex, UniversalConversionArtifactQuery } from './universal-conversion-artifact-query.js';

type UniversalConversionWorklistSemanticEditFieldKey =
  | 'semanticEditStatuses' | 'semanticEditScriptIds' | 'semanticEditProjectionIds' | 'semanticEditReplayIds'
  | 'semanticEditReplayStatuses' | 'semanticEditReplayActions' | 'semanticEditAdmissionStatuses'
  | 'semanticEditAdmissionActions' | 'semanticEditAdmissionReadinesses'
  | 'semanticEditReplayCurrentHashes' | 'semanticEditReplayOutputHashes'
  | 'semanticEditKeys' | 'semanticEditHashes' | 'semanticIdentityHashes' | 'sourceIdentityHashes'
  | 'operationContentHashes' | 'editContentHashes' | 'sourceBackprojectionModes'
  | 'semanticTransformIds' | 'semanticTransformKeys' | 'semanticTransformIdentityHashes'
  | 'semanticTransformContentHashes' | 'projectionIdentityHashes'
  | 'semanticTransformReadinesses' | 'semanticTransformEvidenceIds'
  | 'transformSourceLanguages' | 'transformTargetLanguages'
  | 'transformSourcePaths' | 'transformTargetPaths' | 'transformCrossLanguages'
  | 'transformSourceMapIds' | 'transformSourceMapLinkIds' | 'transformSourceMapMappingIds'
  | 'transformBaseHashes' | 'transformTargetHashes'
  | 'targetPortabilityStatuses' | 'targetPortabilityActions' | 'targetPortabilityReasonCodes'
  | 'semanticEditSidecarQualityRecords' | 'semanticEditSidecarSymbolCount'
  | 'semanticEditSidecarOwnershipRegionCount' | 'semanticEditSidecarPatchHintCount'
  | 'semanticEditSidecarWarningCount' | 'semanticEditSidecarZeroRecordWarningCount'
  | 'semanticEditSidecarWarningCodes' | 'semanticEditSidecarZeroRecordWarningCodes';

type UniversalConversionWorklistSemanticEditQueryKey =
  | 'semanticEditStatus' | 'semanticEditStatuses' | 'semanticEditScriptId' | 'semanticEditScriptIds'
  | 'semanticEditProjectionId' | 'semanticEditProjectionIds' | 'semanticEditReplayId' | 'semanticEditReplayIds'
  | 'semanticEditReplayStatus' | 'semanticEditReplayStatuses' | 'semanticEditReplayAction' | 'semanticEditReplayActions'
  | 'semanticEditAdmission' | 'semanticEditAdmissionStatus' | 'semanticEditAdmissionStatuses'
  | 'semanticEditAdmissionAction' | 'semanticEditAdmissionActions'
  | 'semanticEditAdmissionReadiness' | 'semanticEditAdmissionReadinesses'
  | 'semanticEditReplayCurrentHash' | 'semanticEditReplayCurrentHashes'
  | 'semanticEditReplayOutputHash' | 'semanticEditReplayOutputHashes'
  | 'semanticEditKey' | 'semanticEditKeys' | 'semanticEditHash' | 'semanticEditHashes'
  | 'semanticIdentityHash' | 'semanticIdentityHashes' | 'sourceIdentityHash' | 'sourceIdentityHashes'
  | 'operationContentHash' | 'operationContentHashes' | 'editContentHash' | 'editContentHashes'
  | 'sourceBackprojectionMode' | 'sourceBackprojectionModes'
  | 'semanticTransformId' | 'semanticTransformIds' | 'semanticTransformKey' | 'semanticTransformKeys'
  | 'semanticTransformIdentityHash' | 'semanticTransformIdentityHashes'
  | 'semanticTransformContentHash' | 'semanticTransformContentHashes'
  | 'projectionIdentityHash' | 'projectionIdentityHashes'
  | 'semanticTransformReadiness' | 'semanticTransformReadinesses'
  | 'semanticTransformEvidenceId' | 'semanticTransformEvidenceIds'
  | 'transformSourceLanguage' | 'transformSourceLanguages' | 'transformTargetLanguage' | 'transformTargetLanguages'
  | 'transformSourcePath' | 'transformSourcePaths' | 'transformTargetPath' | 'transformTargetPaths'
  | 'transformCrossLanguage' | 'transformCrossLanguages'
  | 'transformSourceMapId' | 'transformSourceMapIds' | 'transformSourceMapLinkId' | 'transformSourceMapLinkIds'
  | 'transformSourceMapMappingId' | 'transformSourceMapMappingIds'
  | 'transformBaseHash' | 'transformBaseHashes' | 'transformTargetHash' | 'transformTargetHashes'
  | 'targetPortabilityStatus' | 'targetPortabilityStatuses'
  | 'targetPortabilityAction' | 'targetPortabilityActions'
  | 'targetPortabilityReasonCode' | 'targetPortabilityReasonCodes'
  | 'semanticEditSidecarWarningCode' | 'semanticEditSidecarWarningCodes'
  | 'semanticEditSidecarZeroRecordWarningCode' | 'semanticEditSidecarZeroRecordWarningCodes';

export interface UniversalConversionWorklistSemanticEditFields extends Pick<UniversalConversionArtifactIndex, UniversalConversionWorklistSemanticEditFieldKey> {}

export interface UniversalConversionWorklistSemanticEditQuery extends Pick<UniversalConversionArtifactQuery, UniversalConversionWorklistSemanticEditQueryKey> {}

export type UniversalConversionWorkItemKind =
  | 'add-target-adapter'
  | 'collect-translation-proof'
  | 'prove-runtime-adapter'
  | 'collect-runtime-proof-signal'
  | 'collect-dialect-evidence'
  | 'collect-interlingua-obligation-proof'
  | 'collect-source-evidence'
  | 'review-route'
  | 'unblock-route';

export type UniversalConversionWorkItemAction =
  | 'add-target-adapter'
  | 'collect-translation-evidence'
  | 'collect-runtime-adapter-proof'
  | 'collect-runtime-proof-signals'
  | 'collect-dialect-projection-evidence'
  | 'collect-interlingua-obligation-evidence'
  | 'collect-source-evidence'
  | 'review-conversion-route'
  | 'resolve-blocker';

export interface UniversalConversionWorkItem extends UniversalConversionWorklistRuntimeRouteFields, UniversalConversionWorklistSourceMapFields, UniversalConversionWorklistSemanticEditFields {
  readonly id: string;
  readonly kind: UniversalConversionWorkItemKind;
  readonly action: UniversalConversionWorkItemAction;
  readonly priority: UniversalConversionPriority;
  readonly routeIds: readonly string[];
  readonly sourceLanguages: readonly string[];
  readonly languageIds: readonly string[];
  readonly targets: readonly string[];
  readonly modes: readonly UniversalConversionRouteMode[];
  readonly readinesses: readonly string[];
  readonly admissionActions: readonly UniversalConversionAdmissionAction[];
  readonly routeActions: readonly UniversalConversionRouteAction[];
  readonly evidenceKeys: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly tasks: readonly string[];
  readonly runtimeAdapterRequirementIds: readonly string[];
  readonly runtimeProofObligationIds: readonly string[];
  readonly runtimeProofCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly runtimeProofStatuses: readonly string[];
  readonly runtimeProofRequiredSignals: readonly UniversalRuntimeProofSignalKind[];
  readonly runtimeProofProvidedSignals: readonly UniversalRuntimeProofSignalKind[];
  readonly runtimeProofMissingSignals: readonly UniversalRuntimeProofSignalKind[];
  readonly dialectRecordIds: readonly string[];
  readonly targetAdapterIds: readonly string[];
  readonly interlinguaConstraintFamilies: readonly UniversalInterlinguaConstraintEdgeKind[];
  readonly interlinguaConstraintStatuses: readonly string[];
  readonly interlinguaConstraintActions: readonly string[];
  readonly interlinguaConstraintSourceIds: readonly string[];
  readonly interlinguaConstraintEvidenceIds: readonly string[];
  readonly interlinguaConstraintRequiredKinds: readonly string[];
  readonly interlinguaConstraintRepresentedKinds: readonly string[];
  readonly interlinguaConstraintMissingKinds: readonly string[];
  readonly interlinguaConstraintMissingEvidence: readonly string[];
  readonly interlinguaConstraintObligationKinds: readonly string[];
  readonly interlinguaConstraintObligationStatuses: readonly string[];
  readonly interlinguaConstraintObligationEvidenceIds: readonly string[];
  readonly interlinguaConstraintObligationMissingEvidence: readonly string[];
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface UniversalConversionWorklistOptions extends UniversalConversionArtifactRuntimeRouteQuery, UniversalConversionArtifactSourceMapQuery, UniversalConversionWorklistSemanticEditQuery {
  readonly generatedAt?: number;
  readonly routeId?: string | readonly string[];
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly language?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly kind?: UniversalConversionWorkItemKind | readonly UniversalConversionWorkItemKind[];
  readonly includeReviewItems?: boolean;
}

export interface UniversalConversionWorklistQuery extends UniversalConversionWorklistOptions {
  readonly id?: string | readonly string[];
  readonly itemId?: string | readonly string[];
  readonly action?: UniversalConversionWorkItemAction | readonly UniversalConversionWorkItemAction[];
  readonly priority?: UniversalConversionPriority | readonly UniversalConversionPriority[];
  readonly languageId?: string | readonly string[];
  readonly mode?: UniversalConversionRouteMode | readonly UniversalConversionRouteMode[];
  readonly readiness?: string | readonly string[];
  readonly admissionAction?: UniversalConversionAdmissionAction | readonly UniversalConversionAdmissionAction[];
  readonly routeAction?: UniversalConversionRouteAction | readonly UniversalConversionRouteAction[];
  readonly evidenceKey?: string | readonly string[];
  readonly missingEvidence?: string | readonly string[];
  readonly blocker?: string | readonly string[];
  readonly reviewReason?: string | readonly string[];
  readonly task?: string | readonly string[];
  readonly runtimeAdapterRequirementId?: string | readonly string[];
  readonly runtimeProofObligationId?: string | readonly string[];
  readonly runtimeProofCapability?: UniversalRuntimeCapabilityKind | readonly UniversalRuntimeCapabilityKind[];
  readonly runtimeProofStatus?: string | readonly string[];
  readonly runtimeProofRequiredSignal?: UniversalRuntimeProofSignalKind | readonly UniversalRuntimeProofSignalKind[];
  readonly runtimeProofProvidedSignal?: UniversalRuntimeProofSignalKind | readonly UniversalRuntimeProofSignalKind[];
  readonly runtimeProofMissingSignal?: UniversalRuntimeProofSignalKind | readonly UniversalRuntimeProofSignalKind[];
  readonly dialectRecordId?: string | readonly string[];
  readonly targetAdapterId?: string | readonly string[];
  readonly interlinguaConstraintFamily?: string | readonly string[];
  readonly interlinguaConstraintStatus?: string | readonly string[];
  readonly interlinguaConstraintAction?: string | readonly string[];
  readonly interlinguaConstraintSourceId?: string | readonly string[];
  readonly interlinguaConstraintEvidenceId?: string | readonly string[];
  readonly interlinguaConstraintRequiredKind?: string | readonly string[];
  readonly interlinguaConstraintRepresentedKind?: string | readonly string[];
  readonly interlinguaConstraintMissingKind?: string | readonly string[];
  readonly interlinguaConstraintMissingEvidence?: string | readonly string[];
  readonly interlinguaConstraintObligationKind?: string | readonly string[];
  readonly interlinguaConstraintObligationStatus?: string | readonly string[];
  readonly interlinguaConstraintObligationEvidenceId?: string | readonly string[];
  readonly interlinguaConstraintObligationMissingEvidence?: string | readonly string[];
}

export interface UniversalConversionWorklist {
  readonly kind: 'frontier.lang.universalConversionWorklist';
  readonly version: 1;
  readonly generatedAt: number;
  readonly planId: string;
  readonly items: readonly UniversalConversionWorkItem[];
  readonly summary: UniversalConversionWorklistSemanticEditFields & {
    readonly items: number;
    readonly byKind: Readonly<Record<string, number>>;
    readonly byPriority: Readonly<Record<string, number>>;
    readonly routeIds: readonly string[];
    readonly sourceLanguages: readonly string[];
    readonly targets: readonly string[];
    readonly evidenceKeys: readonly string[];
    readonly missingEvidence: readonly string[];
    readonly runtimeRouteIds: readonly string[];
    readonly sourceHostIds: readonly string[];
    readonly targetHostIds: readonly string[];
    readonly sourceRuntimes: readonly string[];
    readonly targetRuntimes: readonly string[];
    readonly runtimeReadinesses: readonly string[];
    readonly requiredRuntimeCapabilities: readonly UniversalRuntimeCapabilityKind[];
    readonly satisfiedRuntimeCapabilities: readonly UniversalRuntimeCapabilityKind[];
    readonly missingRuntimeCapabilities: readonly UniversalRuntimeCapabilityKind[];
    readonly sourceMapIds: readonly string[];
    readonly sourceMapMappingIds: readonly string[];
    readonly sourceMapLinkIds: readonly string[];
    readonly routeSourceMapIds: readonly string[];
    readonly routeSourceMapMappingIds: readonly string[];
    readonly routeSourceMapLinkIds: readonly string[];
    readonly admissionRecordSourceMapIds: readonly string[];
    readonly admissionRecordSourceMapMappingIds: readonly string[];
    readonly admissionRecordSourceMapLinkIds: readonly string[];
    readonly evidenceReceiptSourceMapIds: readonly string[];
    readonly evidenceReceiptSourceMapMappingIds: readonly string[];
    readonly evidenceReceiptSourceMapLinkIds: readonly string[];
    readonly runtimeProofCapabilities: readonly UniversalRuntimeCapabilityKind[];
    readonly runtimeProofStatuses: readonly string[];
    readonly runtimeProofRequiredSignals: readonly UniversalRuntimeProofSignalKind[];
    readonly runtimeProofProvidedSignals: readonly UniversalRuntimeProofSignalKind[];
    readonly runtimeProofMissingSignals: readonly UniversalRuntimeProofSignalKind[];
    readonly interlinguaConstraintFamilies: readonly UniversalInterlinguaConstraintEdgeKind[];
    readonly interlinguaConstraintStatuses: readonly string[];
    readonly interlinguaConstraintActions: readonly string[];
    readonly interlinguaConstraintSourceIds: readonly string[];
    readonly interlinguaConstraintEvidenceIds: readonly string[];
    readonly interlinguaConstraintRequiredKinds: readonly string[];
    readonly interlinguaConstraintRepresentedKinds: readonly string[];
    readonly interlinguaConstraintMissingKinds: readonly string[];
    readonly interlinguaConstraintMissingEvidence: readonly string[];
    readonly interlinguaConstraintObligationKinds: readonly string[];
    readonly interlinguaConstraintObligationStatuses: readonly string[];
    readonly interlinguaConstraintObligationEvidenceIds: readonly string[];
    readonly interlinguaConstraintObligationMissingEvidence: readonly string[];
    readonly blockers: number;
    readonly reviewReasons: number;
    readonly targetAdapterGaps: number;
    readonly proofEvidenceGaps: number;
    readonly runtimeAdapterGaps: number;
    readonly runtimeProofSignalGaps: number;
    readonly dialectEvidenceGaps: number;
    readonly interlinguaObligationGaps: number;
    readonly autoMergeClaims: 0;
    readonly semanticEquivalenceClaims: 0;
  };
  readonly metadata: {
    readonly routes: number;
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly note: string;
  };
}

export interface UniversalConversionWorklistQueryResult {
  readonly kind: 'frontier.lang.universalConversionWorklistQuery';
  readonly version: 1;
  readonly found: boolean;
  readonly items: readonly UniversalConversionWorkItem[];
  readonly bestItem?: UniversalConversionWorkItem;
  readonly summary: UniversalConversionWorklist['summary'];
  readonly reasons: readonly string[];
}

export declare const UniversalConversionWorkItemKinds: readonly UniversalConversionWorkItemKind[];
export declare function createUniversalConversionWorklist(
  planOrOptions?: UniversalConversionPlan | UniversalConversionPlanOptions,
  options?: UniversalConversionWorklistOptions
): UniversalConversionWorklist;
export declare function queryUniversalConversionWorklist(
  worklistOrOptions?: UniversalConversionWorklist | UniversalConversionPlan | UniversalConversionPlanOptions,
  query?: UniversalConversionWorklistQuery
): UniversalConversionWorklistQueryResult;
