import type {
  EvidenceRecord,
  FrontierSourceLanguage,
  SemanticMergeReadiness
} from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { NativeImportKnownLossKind } from './native-import-losses.js';
import type { NativeParserFeatureCategory } from './native-parser-features.js';
import type { ProjectionSourceProjectionCoverage, ProjectionTargetCoverageEntry } from './projection-coverage.js';
import type { ProjectionReadinessTargetCell } from './projection-readiness.js';
import type { UniversalCapabilityMatrix, UniversalCapabilityMatrixOptions } from './universal-capability.js';
import type { UniversalRepresentationCoverage, UniversalRepresentationCoverageQuery } from './universal-representation-coverage.js';
import type { UniversalInterlinguaQuery, UniversalInterlinguaRecord } from './universal-interlingua.js';
import type { UniversalConversionPlanCompactCounts } from './universal-conversion-compact-counts.js';
import type { UniversalRuntimeAdapterRequirement, UniversalRuntimeCapabilityKind, UniversalRuntimeCapabilityMatrix, UniversalRuntimeCapabilityRoute, UniversalRuntimeHostProfile } from './universal-runtime-capabilities.js';
import type { UniversalEffectConstraintEvidence, UniversalEffectConstraintInput, UniversalEffectConstraintQuery } from './universal-effect-constraints.js';
import type { UniversalLifetimeConstraintEvidence, UniversalLifetimeConstraintInput, UniversalLifetimeConstraintQuery } from './universal-lifetime-constraints.js';
import type { UniversalModuleConstraintEvidence, UniversalModuleConstraintInput, UniversalModuleConstraintQuery } from './universal-module-constraints.js';
import type { UniversalTypeConstraintEvidence, UniversalTypeConstraintInput, UniversalTypeConstraintQuery } from './universal-type-constraints.js';
import type { UniversalResourceTransferEvidence, UniversalResourceTransferInput, UniversalResourceTransferQuery } from './universal-resource-transfer.js';
import type {
  UniversalDialectConstructKind,
  UniversalDialectProjectionDisposition,
  UniversalDialectRecordInput,
  UniversalDialectRegistry,
  UniversalDialectRegistryInput,
  UniversalExternRecordInput
} from './universal-dialects.js';
export type UniversalConversionRouteMode =
  | 'preserve-source'
  | 'target-adapter'
  | 'stub-only'
  | 'semantic-index-only'
  | 'blocked';
export type UniversalConversionRouteAction = 'preserve-source' | 'run-target-adapter' | 'attach-adapter-evidence' | 'emit-stub' | 'add-target-adapter' | 'blocked';
export type UniversalConversionAdmissionAction = 'admit' | 'prioritize' | 'reject';
export type UniversalConversionPriority = 'low' | 'normal' | 'high' | 'blocker'; export type UniversalConversionRisk = 'low' | 'medium' | 'high';
export type UniversalTranslationAdmissionStatus = 'blocked' | 'needs-adapter' | 'needs-evidence' | 'needs-review' | 'admittable-for-review'; export type UniversalTranslationAdmissionAction = 'reject' | 'add-target-adapter' | 'collect-translation-evidence' | 'review-target-adapter' | 'materialize-review-record';
export type UniversalConversionScoreComponentKey =
  | 'importEvidence'
  | 'parserEvidence'
  | 'semanticIndex'
  | 'representationCoverage'
  | 'projectionPath'
  | 'proofEvidence';
export interface UniversalConversionScoreComponent {
  readonly key: UniversalConversionScoreComponentKey;
  readonly score: number;
  readonly weight: number;
  readonly weightedScore: number;
  readonly status: 'strong' | 'partial' | 'weak' | 'blocked';
  readonly reasons: readonly string[];
  readonly signals: Record<string, unknown>;
}
export interface UniversalConversionMergeScore {
  readonly schema: 'frontier.lang.semanticMergeScore.v1';
  readonly version: 1;
  readonly value: number;
  readonly uncappedValue: number;
  readonly sortKey: number;
  readonly higherIsBetter: true;
  readonly readiness: SemanticMergeReadiness;
  readonly risk: UniversalConversionRisk;
  readonly action: UniversalConversionAdmissionAction;
  readonly components: Readonly<Record<UniversalConversionScoreComponentKey, UniversalConversionScoreComponent>>;
  readonly penalties: readonly string[];
}

export interface UniversalConversionRouteEvidence {
  readonly imports: number;
  readonly importReadiness: SemanticMergeReadiness;
  readonly symbols: number;
  readonly sourceMaps: number;
  readonly sourceMapMappings: number;
  readonly losses: number;
  readonly parserRows: number;
  readonly mergeReadyParsers: number;
  readonly exactSourceImports: number;
  readonly declarationImports: number;
  readonly targetSupported: boolean;
  readonly targetAdapter?: string;
  readonly targetLossKinds: readonly NativeImportKnownLossKind[];
}

export interface UniversalTranslationAdmission {
  readonly status: UniversalTranslationAdmissionStatus; readonly action: UniversalTranslationAdmissionAction;
  readonly requiredConstructKinds: readonly string[]; readonly representedConstructKinds: readonly string[]; readonly missingConstructKinds: readonly string[]; readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[]; readonly review: readonly string[]; readonly evidenceIds: readonly string[]; readonly proofEvidenceIds: readonly string[];
  readonly runtimeReadiness: SemanticMergeReadiness | string; readonly runtimeAdapterRequirementIds: readonly string[]; readonly dialectReadiness: SemanticMergeReadiness | string; readonly dialectRecordIds: readonly string[];
  readonly resourceTransfer?: { readonly id?: string; readonly status?: string; readonly action?: string; readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly losses: readonly string[]; readonly ownershipConstraints?: { readonly id?: string; readonly status?: string; readonly action?: string; readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[] } };
  readonly resourceTransferStatus?: string; readonly resourceTransferAction?: string; readonly resourceTransferMissingEvidence: readonly string[];
  readonly lifetimeConstraint?: { readonly id?: string; readonly status?: string; readonly action?: string; readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[] }; readonly lifetimeConstraintStatus?: string; readonly lifetimeConstraintAction?: string; readonly lifetimeConstraintMissingEvidence: readonly string[];
  readonly effectConstraint?: { readonly id?: string; readonly status?: string; readonly action?: string; readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[] }; readonly effectConstraintStatus?: string; readonly effectConstraintAction?: string; readonly effectConstraintMissingEvidence: readonly string[];
  readonly moduleConstraint?: { readonly id?: string; readonly status?: string; readonly action?: string; readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[] }; readonly moduleConstraintStatus?: string; readonly moduleConstraintAction?: string; readonly moduleConstraintMissingEvidence: readonly string[];
  readonly typeConstraint?: { readonly id?: string; readonly status?: string; readonly action?: string; readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[] }; readonly typeConstraintStatus?: string; readonly typeConstraintAction?: string; readonly typeConstraintMissingEvidence: readonly string[];
  readonly targetAdapterId?: string; readonly autoMergeClaim: false; readonly semanticEquivalenceClaim: false;
}
export type { UniversalInterlinguaRecord } from './universal-interlingua.js';
export interface UniversalConversionRouteRuntime {
  readonly routeId?: string;
  readonly source?: UniversalRuntimeCapabilityRoute['source'];
  readonly target?: UniversalRuntimeCapabilityRoute['target'];
  readonly requiredCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly satisfiedCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly adapterRequirements: readonly UniversalRuntimeAdapterRequirement[];
  readonly missingCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly readiness: SemanticMergeReadiness;
  readonly blockers: readonly string[];
  readonly review: readonly string[];
}

export interface UniversalConversionRouteDialect {
  readonly registryIds: readonly string[];
  readonly recordIds: readonly string[];
  readonly constructKinds: readonly UniversalDialectConstructKind[];
  readonly externKinds: readonly string[];
  readonly projectionDispositions: readonly UniversalDialectProjectionDisposition[];
  readonly evidenceIds: readonly string[];
  readonly lossIds: readonly string[];
  readonly readiness: SemanticMergeReadiness;
  readonly records: readonly Record<string, unknown>[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly tasks: readonly string[];
}

export interface UniversalConversionRouteMergeRefs {
  readonly planId: string;
  readonly routeId: string;
  readonly historyIds: readonly string[];
  readonly patchBundleIds: readonly string[];
  readonly patchIds: readonly string[];
  readonly mergeCandidateIds: readonly string[];
  readonly replayLinks: readonly unknown[];
  readonly evidenceIds: readonly string[];
  readonly proofIds: readonly string[];
  readonly sources: readonly {
    readonly sourceId?: string;
    readonly importId?: string;
    readonly sourcePath?: string;
    readonly sourceHash?: string;
    readonly baseHash?: string;
    readonly targetHash?: string;
  }[];
  readonly semanticOwnershipKeys: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly sourceMapIds: readonly string[];
  readonly sourceMapMappingIds: readonly string[];
  readonly sourceMapLinkIds: readonly string[];
  readonly readiness: SemanticMergeReadiness;
  readonly admissionStatus: UniversalConversionAdmissionAction;
  readonly metadata: Record<string, unknown>;
}

export interface UniversalConversionRoute {
  readonly id: string;
  readonly sourceLanguage: FrontierSourceLanguage | string;
  readonly languageIds: readonly string[];
  readonly target: FrontierCompileTarget | string;
  readonly mode: UniversalConversionRouteMode;
  readonly routeAction: UniversalConversionRouteAction;
  readonly admissionAction: UniversalConversionAdmissionAction;
  readonly priority: UniversalConversionPriority;
  readonly readiness: SemanticMergeReadiness;
  readonly lossClass: string;
  readonly adapter?: string;
  readonly adapterKind?: string;
  readonly sourceProjection?: {
    readonly exactSource: ProjectionSourceProjectionCoverage;
    readonly stubs: ProjectionSourceProjectionCoverage;
  };
  readonly projectionReadiness?: ProjectionReadinessTargetCell;
  readonly runtime: UniversalConversionRouteRuntime;
  readonly dialect: UniversalConversionRouteDialect;
  readonly runtimeAdapterRequirements: readonly UniversalRuntimeAdapterRequirement[];
  readonly evidence: UniversalConversionRouteEvidence;
  readonly representation: UniversalRepresentationCoverage;
  readonly interlingua: UniversalInterlinguaRecord;
  readonly resourceTransfer?: UniversalResourceTransferEvidence; readonly lifetimeConstraint?: UniversalLifetimeConstraintEvidence; readonly effectConstraint?: UniversalEffectConstraintEvidence; readonly moduleConstraint?: UniversalModuleConstraintEvidence; readonly typeConstraint?: UniversalTypeConstraintEvidence;
  readonly missingEvidence: readonly string[];
  readonly translationAdmission: UniversalTranslationAdmission;
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly tasks: readonly string[];
  readonly mergeScore: UniversalConversionMergeScore;
  readonly mergeRefs: UniversalConversionRouteMergeRefs;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly metadata: Record<string, unknown>;
}
export interface UniversalConversionPlan {
  readonly kind: 'frontier.lang.universalConversionPlan';
  readonly version: 1;
  readonly id: string;
  readonly generatedAt: number;
  readonly routes: readonly UniversalConversionRoute[];
  readonly summary: {
    readonly routes: number;
    readonly byMode: Readonly<Record<UniversalConversionRouteMode, number>>;
    readonly byReadiness: Readonly<Record<SemanticMergeReadiness, number>>;
    readonly byAdmissionAction: Readonly<Record<UniversalConversionAdmissionAction, number>>;
    readonly compactCounts: UniversalConversionPlanCompactCounts;
    readonly readyRoutes: number;
    readonly reviewRoutes: number;
    readonly blockedRoutes: number;
    readonly preserveSourceRoutes: number;
    readonly targetAdapterRoutes: number;
    readonly stubOnlyRoutes: number;
    readonly semanticIndexOnlyRoutes: number;
    readonly missingEvidence: number;
    readonly runtimeAdapterRequirements: number;
    readonly runtimeRoutesWithAdapters: number;
    readonly blockers: number;
    readonly reviewReasons: number;
    readonly autoMergeClaims: 0;
    readonly semanticEquivalenceClaims: 0;
  };
  readonly matrices: {
    readonly universalCapability: UniversalCapabilityMatrix;
    readonly runtimeCapabilities: UniversalRuntimeCapabilityMatrix;
    readonly projectionReadiness?: UniversalCapabilityMatrix['matrices']['projectionReadiness'];
    readonly projectionTargets?: UniversalCapabilityMatrix['matrices']['projectionTargets'];
  };
  readonly metadata: {
    readonly compileTargets: readonly (FrontierCompileTarget | string)[];
    readonly requiredFeatures: readonly NativeParserFeatureCategory[];
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly note: string;
  };
}

export interface UniversalConversionPlanOptions extends UniversalCapabilityMatrixOptions {
  readonly id?: string;
  readonly universalCapabilityMatrix?: UniversalCapabilityMatrix;
  readonly universalRuntimeCapabilityMatrix?: UniversalRuntimeCapabilityMatrix;
  readonly hostProfiles?: readonly UniversalRuntimeHostProfile[];
  readonly runtimeHosts?: readonly UniversalRuntimeHostProfile[];
  readonly sourceHosts?: readonly (string | UniversalRuntimeHostProfile)[] | Readonly<Record<string, string | UniversalRuntimeHostProfile>>;
  readonly sourceRuntimeHosts?: readonly (string | UniversalRuntimeHostProfile)[] | Readonly<Record<string, string | UniversalRuntimeHostProfile>>;
  readonly targetHosts?: readonly (string | UniversalRuntimeHostProfile)[] | Readonly<Record<string, string | UniversalRuntimeHostProfile>>;
  readonly targetRuntimeHosts?: readonly (string | UniversalRuntimeHostProfile)[] | Readonly<Record<string, string | UniversalRuntimeHostProfile>>;
  readonly sourceRuntime?: string;
  readonly targetRuntime?: string;
  readonly sourceRuntimes?: Readonly<Record<string, string>>;
  readonly targetRuntimes?: Readonly<Record<string, string>>;
  readonly universalDialectRegistry?: UniversalDialectRegistryInput | UniversalDialectRegistry;
  readonly dialects?: readonly UniversalDialectRecordInput[];
  readonly externs?: readonly UniversalExternRecordInput[];
  readonly resourceTransfer?: UniversalResourceTransferInput | UniversalResourceTransferEvidence; readonly translationResourceTransfer?: UniversalResourceTransferInput | UniversalResourceTransferEvidence; readonly resourceTransfers?: readonly (UniversalResourceTransferInput | UniversalResourceTransferEvidence)[];
  readonly lifetimeConstraint?: UniversalLifetimeConstraintInput | UniversalLifetimeConstraintEvidence; readonly translationLifetimeConstraint?: UniversalLifetimeConstraintInput | UniversalLifetimeConstraintEvidence; readonly lifetimeConstraints?: readonly (UniversalLifetimeConstraintInput | UniversalLifetimeConstraintEvidence)[];
  readonly effectConstraint?: UniversalEffectConstraintInput | UniversalEffectConstraintEvidence; readonly translationEffectConstraint?: UniversalEffectConstraintInput | UniversalEffectConstraintEvidence; readonly effectConstraints?: readonly (UniversalEffectConstraintInput | UniversalEffectConstraintEvidence)[];
  readonly moduleConstraint?: UniversalModuleConstraintInput | UniversalModuleConstraintEvidence; readonly translationModuleConstraint?: UniversalModuleConstraintInput | UniversalModuleConstraintEvidence; readonly moduleConstraints?: readonly (UniversalModuleConstraintInput | UniversalModuleConstraintEvidence)[];
  readonly typeConstraint?: UniversalTypeConstraintInput | UniversalTypeConstraintEvidence; readonly translationTypeConstraint?: UniversalTypeConstraintInput | UniversalTypeConstraintEvidence; readonly typeConstraints?: readonly (UniversalTypeConstraintInput | UniversalTypeConstraintEvidence)[];
  readonly runtimeRequirements?: readonly (
    | UniversalRuntimeCapabilityKind
    | {
      readonly capability?: UniversalRuntimeCapabilityKind;
      readonly kind?: UniversalRuntimeCapabilityKind;
      readonly capabilities?: readonly UniversalRuntimeCapabilityKind[];
      readonly requiredCapabilities?: readonly UniversalRuntimeCapabilityKind[];
      readonly sourceLanguage?: FrontierSourceLanguage | string;
      readonly language?: FrontierSourceLanguage | string;
      readonly sourceRuntime?: string;
      readonly runtime?: string;
      readonly sourceHost?: string | UniversalRuntimeHostProfile;
      readonly sourceRuntimeHost?: string | UniversalRuntimeHostProfile;
      readonly target?: FrontierCompileTarget | string;
      readonly targetRuntime?: string;
      readonly targetHost?: string | UniversalRuntimeHostProfile;
      readonly targetRuntimeHost?: string | UniversalRuntimeHostProfile;
      readonly reason?: string;
      readonly evidenceIds?: readonly string[];
    }
  )[];
  readonly requiredRuntimeCapabilities?: UniversalConversionPlanOptions['runtimeRequirements'];
  readonly effects?: UniversalConversionPlanOptions['runtimeRequirements'];
  readonly evidence?: readonly EvidenceRecord[];
}
export interface UniversalConversionPlanQuery extends UniversalRepresentationCoverageQuery, UniversalInterlinguaQuery, UniversalResourceTransferQuery, UniversalLifetimeConstraintQuery, UniversalEffectConstraintQuery, UniversalModuleConstraintQuery, UniversalTypeConstraintQuery {
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly language?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: UniversalConversionRouteMode;
  readonly readiness?: SemanticMergeReadiness;
  readonly admissionAction?: UniversalConversionAdmissionAction;
  readonly runtimeRouteId?: string;
  readonly sourceHostId?: string;
  readonly targetHostId?: string;
  readonly sourceRuntime?: string;
  readonly runtime?: string;
  readonly targetRuntime?: string;
  readonly runtimeReadiness?: SemanticMergeReadiness;
  readonly missingRuntimeCapability?: UniversalRuntimeCapabilityKind;
  readonly runtimeAdapterRequirementId?: string;
  readonly dialectReadiness?: SemanticMergeReadiness;
  readonly dialectRegistryId?: string;
  readonly dialectRecordId?: string;
  readonly dialectConstructKind?: UniversalDialectConstructKind;
  readonly dialectDisposition?: UniversalDialectProjectionDisposition;
  readonly translationAdmissionStatus?: UniversalTranslationAdmissionStatus; readonly translationAdmissionAction?: UniversalTranslationAdmissionAction;
  readonly missingTranslationEvidence?: string; readonly translationEvidenceId?: string; readonly translationProofEvidenceId?: string;
  readonly requiredTranslationConstructKind?: string; readonly representedTranslationConstructKind?: string; readonly targetAdapterId?: string;
}

export interface UniversalConversionPlanQueryResult {
  readonly kind: 'frontier.lang.universalConversionPlanQuery';
  readonly version: 1;
  readonly found: boolean;
  readonly routes: readonly UniversalConversionRoute[];
  readonly bestRoute?: UniversalConversionRoute;
  readonly reasons: readonly string[];
}

export declare function createUniversalConversionPlan(options?: UniversalConversionPlanOptions): UniversalConversionPlan;
export declare function queryUniversalConversionPlan(
  planOrOptions?: UniversalConversionPlan | UniversalConversionPlanOptions,
  query?: UniversalConversionPlanQuery
): UniversalConversionPlanQueryResult;
