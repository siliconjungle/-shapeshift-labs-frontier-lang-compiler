import type {
  FrontierSourceLanguage,
  SemanticMergeReadiness
} from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type {
  UniversalConversionAdmissionAction,
  UniversalConversionPriority,
  UniversalConversionRouteAction,
  UniversalConversionRouteMode,
  UniversalConversionRisk,
  UniversalTranslationAdmissionAction,
  UniversalTranslationAdmissionStatus
} from './universal-conversion-plan.js';
import type {
  UniversalConversionArtifactAdmissionBucket,
  UniversalConversionArtifactAdmissionStatus
} from './universal-conversion-artifacts.js';
import type { UniversalRepresentationCoverageQuery } from './universal-representation-coverage.js';
import type { UniversalInterlinguaQuery } from './universal-interlingua.js';

export interface UniversalConversionArtifactIndex {
  readonly routeIds: readonly string[];
  readonly historyIds: readonly string[];
  readonly patchBundleIds: readonly string[];
  readonly admissionRecordIds: readonly string[];
  readonly languages: readonly string[];
  readonly targets: readonly string[];
  readonly modes: readonly string[];
  readonly lossClasses: readonly string[];
  readonly adapterIds: readonly string[];
  readonly adapterKinds: readonly string[];
  readonly routeMissingEvidence: readonly string[];
  readonly runtimeAdapterRequirementIds: readonly string[];
  readonly blockers: readonly string[];
  readonly reviewReasons: readonly string[];
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
  readonly sourceBackprojectionModes: readonly string[];
  readonly semanticTransformReadinesses: readonly string[];
  readonly transformSourceLanguages: readonly string[];
  readonly transformTargetLanguages: readonly string[];
  readonly transformSourcePaths: readonly string[];
  readonly transformTargetPaths: readonly string[];
  readonly transformCrossLanguages: readonly string[];
  readonly transformSourceMapIds: readonly string[];
  readonly transformSourceMapLinkIds: readonly string[];
  readonly transformSourceMapMappingIds: readonly string[];
  readonly transformBaseHashes: readonly string[];
  readonly transformTargetHashes: readonly string[];
  readonly targetPortabilityStatuses: readonly string[];
  readonly targetPortabilityActions: readonly string[];
  readonly targetPortabilityReasonCodes: readonly string[];
  readonly representationConstructKinds: readonly string[];
  readonly runtimeCapabilities: readonly string[];
  readonly sourceMapPrecisions: readonly string[];
  readonly translationAdmissionStatuses: readonly string[];
  readonly translationAdmissionActions: readonly string[];
  readonly missingTranslationEvidence: readonly string[];
  readonly translationEvidenceIds: readonly string[];
  readonly translationProofEvidenceIds: readonly string[];
  readonly requiredTranslationConstructKinds: readonly string[];
  readonly representedTranslationConstructKinds: readonly string[];
  readonly targetAdapterIds: readonly string[];
  readonly interlinguaRecordIds: readonly string[];
  readonly interlinguaLayerKinds: readonly string[];
  readonly interlinguaRepresentedLayerKinds: readonly string[];
  readonly interlinguaMissingLayerKinds: readonly string[];
  readonly interlinguaReviewLayerKinds: readonly string[];
  readonly interlinguaBlockedLayerKinds: readonly string[];
  readonly interlinguaLoweringDispositions: readonly string[];
  readonly interlinguaMissingEvidence: readonly string[];
  readonly interlinguaProofEvidenceIds: readonly string[];
  readonly transformIdentityHashes: readonly string[];
}

export interface UniversalConversionArtifactQuery extends UniversalRepresentationCoverageQuery, UniversalInterlinguaQuery {
  readonly routeId?: string | readonly string[];
  readonly historyId?: string | readonly string[];
  readonly patchBundleId?: string | readonly string[];
  readonly admissionRecordId?: string | readonly string[];
  readonly sourceLanguage?: FrontierSourceLanguage | string | readonly string[];
  readonly target?: FrontierCompileTarget | string | readonly string[];
  readonly mode?: UniversalConversionRouteMode | readonly string[];
  readonly lossClass?: string | readonly string[];
  readonly adapterId?: string | readonly string[];
  readonly adapterKind?: string | readonly string[];
  readonly routeMissingEvidence?: string | readonly string[];
  readonly runtimeAdapterRequirementId?: string | readonly string[];
  readonly blocker?: string | readonly string[];
  readonly reviewReason?: string | readonly string[];
  readonly readiness?: SemanticMergeReadiness | string | readonly string[];
  readonly admissionAction?: UniversalConversionAdmissionAction | readonly string[];
  readonly admissionStatus?: UniversalConversionArtifactAdmissionStatus | readonly string[];
  readonly admissionBucket?: UniversalConversionArtifactAdmissionBucket | readonly string[];
  readonly translationAdmissionStatus?: UniversalTranslationAdmissionStatus | readonly string[];
  readonly translationAdmissionAction?: UniversalTranslationAdmissionAction | readonly string[];
  readonly missingTranslationEvidence?: string | readonly string[];
  readonly translationEvidenceId?: string | readonly string[];
  readonly translationProofEvidenceId?: string | readonly string[];
  readonly requiredTranslationConstructKind?: string | readonly string[];
  readonly representedTranslationConstructKind?: string | readonly string[];
  readonly targetAdapterId?: string | readonly string[];
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
  readonly sourceBackprojectionMode?: string | readonly string[];
  readonly sourceBackprojectionModes?: readonly string[];
  readonly semanticTransformReadiness?: string | readonly string[];
  readonly semanticTransformReadinesses?: readonly string[];
  readonly transformSourceLanguage?: string | readonly string[];
  readonly transformSourceLanguages?: readonly string[];
  readonly transformTargetLanguage?: string | readonly string[];
  readonly transformTargetLanguages?: readonly string[];
  readonly transformSourcePath?: string | readonly string[];
  readonly transformSourcePaths?: readonly string[];
  readonly transformTargetPath?: string | readonly string[];
  readonly transformTargetPaths?: readonly string[];
  readonly transformCrossLanguage?: boolean | string | readonly string[];
  readonly transformCrossLanguages?: readonly string[];
  readonly transformSourceMapId?: string | readonly string[];
  readonly transformSourceMapIds?: readonly string[];
  readonly transformSourceMapLinkId?: string | readonly string[];
  readonly transformSourceMapLinkIds?: readonly string[];
  readonly transformSourceMapMappingId?: string | readonly string[];
  readonly transformSourceMapMappingIds?: readonly string[];
  readonly transformBaseHash?: string | readonly string[];
  readonly transformBaseHashes?: readonly string[];
  readonly transformTargetHash?: string | readonly string[];
  readonly transformTargetHashes?: readonly string[];
  readonly targetPortabilityStatus?: string | readonly string[];
  readonly targetPortabilityStatuses?: readonly string[];
  readonly targetPortabilityAction?: string | readonly string[];
  readonly targetPortabilityActions?: readonly string[];
  readonly targetPortabilityReasonCode?: string | readonly string[];
  readonly targetPortabilityReasonCodes?: readonly string[];
  readonly representationConstructKind?: string | readonly string[];
}
