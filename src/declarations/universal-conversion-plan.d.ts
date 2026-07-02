import type { EvidenceRecord, FrontierLangDocument, FrontierSourceLanguage as SL, SemanticMergeReadiness as SMR } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget as CT } from './compile.js';
import type { NativeImportKnownLossKind } from './native-import-losses.js';
import type { NativeParserFeatureCategory } from './native-parser-features.js';
import type { ProjectionSourceProjectionCoverage, ProjectionTargetCoverageEntry } from './projection-coverage.js';
import type { ProjectionReadinessTargetCell } from './projection-readiness.js';
import type { UniversalCapabilityMatrix as UCM, UniversalCapabilityMatrixOptions as UCO } from './universal-capability.js';
import type { UniversalRepresentationCoverage as URC, UniversalRepresentationCoverageQuery as URCQ } from './universal-representation-coverage.js';
import type { UniversalInterlinguaQuery, UniversalInterlinguaRecord } from './universal-interlingua.js';
import type { UniversalConversionPlanCompactCounts } from './universal-conversion-compact-counts.js';
import type { UniversalTranslationConstraintFieldName as TCN } from './universal-conversion-constraint-families.js';
import type { UniversalRuntimeAdapterRequirement as URA, UniversalRuntimeCapabilityKind as URK, UniversalRuntimeCapabilityMatrix as URM, UniversalRuntimeCapabilityRoute as URR, UniversalRuntimeHostProfile as URH, UniversalRuntimeProofObligation as URO, UniversalRuntimeProofSignalKind as UPS, UniversalRuntimeRequirementInput as URI } from './universal-runtime-capabilities.js';
import type { UniversalConversionPlanConstraintOptions, UniversalConversionPlanConstraintQuery, UniversalConversionRouteConstraintFields } from './universal-conversion-plan-constraints.js';
import type {
  UniversalDialectConstructKind,
  UniversalDialectProjectionDisposition,
  UniversalDialectRecordInput,
  UniversalDialectRegistry,
  UniversalDialectRegistryInput,
  UniversalExternRecordInput
} from './universal-dialects.js';
type UniversalConversionPlanRepresentationQuery = Omit<URCQ, 'dialectReadiness'>;
type QueryFilter<T> = T | readonly T[];
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
  readonly readiness: SMR;
  readonly risk: UniversalConversionRisk;
  readonly action: UniversalConversionAdmissionAction;
  readonly components: Readonly<Record<UniversalConversionScoreComponentKey, UniversalConversionScoreComponent>>;
  readonly penalties: readonly string[];
}
export interface UniversalConversionRouteEvidence {
  readonly imports: number;
  readonly importReadiness: SMR;
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
export interface UniversalTranslationConstraintSummary { readonly id?: string; readonly status?: string; readonly action?: string; readonly requiredKinds: RO<string>; readonly representedKinds: RO<string>; readonly missingKinds: RO<string>; readonly missingEvidence: RO<string>; } type TCS = UniversalTranslationConstraintSummary; type RO<T> = readonly T[]; type Rdy = SMR|string; type TCF = { readonly [K in TCN]?: TCS } & { readonly [K in `${TCN}Status`]?: string } & { readonly [K in `${TCN}Action`]?: string } & { readonly [K in `${TCN}MissingEvidence`]: RO<string> };
export interface UniversalTranslationAdmission extends TCF {
  readonly status: UniversalTranslationAdmissionStatus; readonly action: UniversalTranslationAdmissionAction;
  readonly requiredConstructKinds: RO<string>; readonly representedConstructKinds: RO<string>; readonly missingConstructKinds: RO<string>; readonly missingEvidence: RO<string>;
  readonly blockers: RO<string>; readonly review: RO<string>; readonly evidenceIds: RO<string>; readonly proofEvidenceIds: RO<string>;
  readonly runtimeReadiness: Rdy; readonly runtimeAdapterRequirementIds: RO<string>; readonly runtimeProofObligationIds: RO<string>; readonly runtimeProofCapabilities: RO<URK>; readonly runtimeProofStatuses: RO<string>; readonly runtimeProofRequiredSignals: RO<UPS>; readonly runtimeProofProvidedSignals: RO<UPS>; readonly runtimeProofMissingSignals: RO<UPS>; readonly dialectReadiness: Rdy; readonly dialectRecordIds: RO<string>;
  readonly resourceTransfer?: Omit<TCS, 'missingEvidence'> & { readonly losses: RO<string>; readonly ownershipConstraints?: TCS };
  readonly resourceTransferStatus?: string; readonly resourceTransferAction?: string; readonly resourceTransferMissingEvidence: RO<string>;
  readonly targetAdapterId?: string; readonly autoMergeClaim: false; readonly semanticEquivalenceClaim: false;
}
export type { UniversalInterlinguaRecord } from './universal-interlingua.js';
export interface UniversalConversionRouteRuntime {
  readonly routeId?: string;
  readonly source?: URR['source'];
  readonly target?: URR['target'];
  readonly requiredCapabilities: readonly URK[];
  readonly satisfiedCapabilities: readonly URK[];
  readonly adapterRequirements: readonly URA[];
  readonly proofObligations: readonly URO[];
  readonly missingCapabilities: readonly URK[];
  readonly readiness: SMR;
  readonly blockers: RO<string>;
  readonly review: RO<string>;
}
export interface UniversalConversionRouteDialect {
  readonly registryIds: RO<string>;
  readonly recordIds: RO<string>;
  readonly constructKinds: readonly UniversalDialectConstructKind[];
  readonly externKinds: RO<string>;
  readonly projectionDispositions: readonly UniversalDialectProjectionDisposition[];
  readonly evidenceIds: RO<string>;
  readonly lossIds: RO<string>;
  readonly readiness: SMR;
  readonly records: readonly Record<string, unknown>[];
  readonly blockers: RO<string>;
  readonly review: RO<string>;
  readonly missingEvidence: RO<string>;
  readonly tasks: RO<string>;
}
export interface UniversalConversionRouteMergeRefs {
  readonly planId: string;
  readonly routeId: string;
  readonly historyIds: RO<string>;
  readonly patchBundleIds: RO<string>;
  readonly patchIds: RO<string>;
  readonly mergeCandidateIds: RO<string>;
  readonly replayLinks: readonly unknown[];
  readonly evidenceIds: RO<string>;
  readonly proofIds: RO<string>;
  readonly sources: readonly {
    readonly sourceId?: string;
    readonly importId?: string;
    readonly sourcePath?: string;
    readonly sourceHash?: string;
    readonly baseHash?: string;
    readonly targetHash?: string;
  }[];
  readonly semanticOwnershipKeys: RO<string>;
  readonly conflictKeys: RO<string>;
  readonly sourceMapIds: RO<string>;
  readonly sourceMapMappingIds: RO<string>;
  readonly sourceMapLinkIds: RO<string>;
  readonly readiness: SMR;
  readonly admissionStatus: UniversalConversionAdmissionAction;
  readonly metadata: Record<string, unknown>;
}
export interface UniversalConversionRoute extends UniversalConversionRouteConstraintFields {
  readonly id: string;
  readonly sourceLanguage: SL | string;
  readonly languageIds: RO<string>;
  readonly target: CT | string;
  readonly mode: UniversalConversionRouteMode;
  readonly routeAction: UniversalConversionRouteAction;
  readonly admissionAction: UniversalConversionAdmissionAction;
  readonly priority: UniversalConversionPriority;
  readonly readiness: SMR;
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
  readonly runtimeAdapterRequirements: readonly URA[];
  readonly evidence: UniversalConversionRouteEvidence;
  readonly representation: URC;
  readonly interlingua: UniversalInterlinguaRecord;
  readonly missingEvidence: RO<string>;
  readonly translationAdmission: UniversalTranslationAdmission;
  readonly blockers: RO<string>;
  readonly review: RO<string>;
  readonly tasks: RO<string>;
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
    readonly byReadiness: Readonly<Record<SMR, number>>;
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
    readonly runtimeProofObligations: number;
    readonly runtimeRoutesWithAdapters: number;
    readonly blockers: number;
    readonly reviewReasons: number;
    readonly autoMergeClaims: 0;
    readonly semanticEquivalenceClaims: 0;
  };
  readonly matrices: {
    readonly universalCapability: UCM;
    readonly runtimeCapabilities: URM;
    readonly projectionReadiness?: UCM['matrices']['projectionReadiness'];
    readonly projectionTargets?: UCM['matrices']['projectionTargets'];
  };
  readonly metadata: {
    readonly compileTargets: readonly (CT | string)[];
    readonly requiredFeatures: readonly NativeParserFeatureCategory[];
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly note: string;
  };
}
export interface UniversalConversionPlanOptions extends UCO, UniversalConversionPlanConstraintOptions {
  readonly id?: string;
  readonly document?: FrontierLangDocument;
  readonly universalCapabilityMatrix?: UCM;
  readonly universalRuntimeCapabilityMatrix?: URM;
  readonly hostProfiles?: readonly URH[];
  readonly runtimeHosts?: readonly URH[];
  readonly sourceHosts?: readonly (string | URH)[] | Readonly<Record<string, string | URH>>;
  readonly sourceRuntimeHosts?: readonly (string | URH)[] | Readonly<Record<string, string | URH>>;
  readonly targetHosts?: readonly (string | URH)[] | Readonly<Record<string, string | URH>>;
  readonly targetRuntimeHosts?: readonly (string | URH)[] | Readonly<Record<string, string | URH>>;
  readonly sourceRuntime?: string;
  readonly targetRuntime?: string;
  readonly sourceRuntimes?: Readonly<Record<string, string>>;
  readonly targetRuntimes?: Readonly<Record<string, string>>;
  readonly universalDialectRegistry?: UniversalDialectRegistryInput | UniversalDialectRegistry;
  readonly dialects?: readonly UniversalDialectRecordInput[];
  readonly externs?: readonly UniversalExternRecordInput[];
  readonly runtimeRequirements?: readonly (URK | URI)[];
  readonly requiredRuntimeCapabilities?: UniversalConversionPlanOptions['runtimeRequirements'];
  readonly effects?: UniversalConversionPlanOptions['runtimeRequirements'];
  readonly evidence?: readonly EvidenceRecord[];
}
export interface FrontierSourceUniversalConversionPlanOptions extends UniversalConversionPlanOptions { readonly fileName?: string; readonly sourcePath?: string; readonly parse?: Record<string, unknown>; }
export interface AuthoredFrontierSourceConversionMetadata {
  readonly documentId: string; readonly sourcePath?: string; readonly conversionPlanId?: string;
  readonly targets: readonly string[]; readonly constraintFamilies: readonly string[];
  readonly constraintSpaceId?: string; readonly constraintSpaceIds: readonly string[]; readonly constraintSpaceVariableIds: readonly string[]; readonly constraintSpaceConstraintIds: readonly string[];
  readonly constraintSpacePreferenceIds: readonly string[]; readonly constraintSpaceCollapseStrategyIds: readonly string[]; readonly constraintSpaceAdmissionIds: readonly string[];
  readonly constraintSpaceSummary?: Readonly<Record<string, number>>;
  readonly sourceRuntimes: Readonly<Record<string, string>>; readonly targetRuntimes: Readonly<Record<string, string>>;
  readonly runtimeRequirementIds: readonly string[]; readonly dialectRecordIds: readonly string[]; readonly externRecordIds: readonly string[];
  readonly decisionGraphId?: string; readonly decisionGraphIds: readonly string[]; readonly decisionGraphRecordIds: readonly string[];
  readonly decisionGraphGateIds: readonly string[]; readonly decisionGraphEvidenceIds: readonly string[]; readonly decisionGraphSemanticChangeIds: readonly string[];
  readonly decisionGraphPatchEventIds: readonly string[]; readonly decisionGraphAdmissionDecisionIds: readonly string[]; readonly decisionGraphDecisionIds: readonly string[];
  readonly decisionGraphReplayRecordIds: readonly string[]; readonly decisionGraphTournamentRecordIds: readonly string[]; readonly decisionGraphRsiLoopIds: readonly string[];
  readonly decisionGraphSummary?: Readonly<Record<string, number>>;
  readonly semanticResourceGraphId?: string; readonly semanticResourceGraphIds: readonly string[]; readonly semanticResourceGraphRecordIds: readonly string[]; readonly semanticResourceGraphResourceIds: readonly string[]; readonly semanticResourceGraphOwnerIds: readonly string[]; readonly semanticResourceGraphLoanIds: readonly string[]; readonly semanticResourceGraphAliasIds: readonly string[];
  readonly semanticResourceGraphMoveIds: readonly string[]; readonly semanticResourceGraphDropIds: readonly string[]; readonly semanticResourceGraphEscapeIds: readonly string[]; readonly semanticResourceGraphLifetimeRegionIds: readonly string[]; readonly semanticResourceGraphLifetimeRelationIds: readonly string[]; readonly semanticResourceGraphBorrowScopeIds: readonly string[]; readonly semanticResourceGraphUnsafeBoundaryIds: readonly string[]; readonly semanticResourceGraphConflictIds: readonly string[]; readonly semanticResourceGraphProofObligationIds: readonly string[]; readonly semanticResourceGraphSummary?: Readonly<Record<string, number>>; readonly universalInterlinguaId?: string; readonly universalInterlinguaRecordIds: readonly string[]; readonly universalInterlinguaLayerIds: readonly string[]; readonly universalInterlinguaConstraintIds: readonly string[]; readonly universalInterlinguaObligationIds: readonly string[]; readonly universalInterlinguaLoweringIds: readonly string[]; readonly universalInterlinguaLiftIds: readonly string[]; readonly universalInterlinguaEvidenceIds: readonly string[]; readonly universalInterlinguaRouteIds: readonly string[]; readonly universalInterlinguaSummary?: Readonly<Record<string, number>>;
}
export interface FrontierSourceUniversalConversionPlan extends UniversalConversionPlan {
  readonly document: FrontierLangDocument; readonly sourcePath?: string;
  readonly metadata: UniversalConversionPlan['metadata'] & { readonly authoredFrontierSource: AuthoredFrontierSourceConversionMetadata; };
}
export interface UniversalConversionPlanQuery extends UniversalConversionPlanRepresentationQuery, UniversalInterlinguaQuery, UniversalConversionPlanConstraintQuery {
  readonly routeId?: QueryFilter<string>;
  readonly sourceLanguage?: QueryFilter<SL | string>;
  readonly language?: QueryFilter<SL | string>;
  readonly target?: QueryFilter<CT | string>;
  readonly mode?: QueryFilter<UniversalConversionRouteMode>;
  readonly readiness?: QueryFilter<SMR>;
  readonly admissionAction?: QueryFilter<UniversalConversionAdmissionAction>;
  readonly runtimeRouteId?: string | readonly string[];
  readonly sourceHostId?: string | readonly string[];
  readonly targetHostId?: string | readonly string[];
  readonly sourceRuntime?: string | readonly string[];
  readonly runtime?: string | readonly string[];
  readonly targetRuntime?: string | readonly string[];
  readonly runtimeReadiness?: SMR | readonly SMR[];
  readonly missingRuntimeCapability?: URK | readonly URK[];
  readonly runtimeAdapterRequirementId?: string | readonly string[];
  readonly runtimeProofObligationId?: string | readonly string[];
  readonly runtimeProofCapability?: URK | readonly URK[];
  readonly runtimeProofStatus?: string | readonly string[];
  readonly runtimeProofRequiredSignal?: UPS | readonly UPS[];
  readonly runtimeProofProvidedSignal?: UPS | readonly UPS[];
  readonly runtimeProofMissingSignal?: UPS | readonly UPS[];
  readonly dialectReadiness?: SMR | readonly SMR[];
  readonly dialectRegistryId?: string | readonly string[];
  readonly dialectRecordId?: string | readonly string[];
  readonly dialectConstructKind?: UniversalDialectConstructKind | readonly UniversalDialectConstructKind[];
  readonly dialectExternKind?: string | readonly string[];
  readonly dialectDisposition?: UniversalDialectProjectionDisposition | readonly UniversalDialectProjectionDisposition[];
  readonly dialectEvidenceId?: string | readonly string[];
  readonly dialectLossId?: string | readonly string[];
  readonly translationAdmissionStatus?: QueryFilter<UniversalTranslationAdmissionStatus>; readonly translationAdmissionAction?: QueryFilter<UniversalTranslationAdmissionAction>;
  readonly missingTranslationEvidence?: QueryFilter<string>; readonly translationEvidenceId?: QueryFilter<string>; readonly translationProofEvidenceId?: QueryFilter<string>;
  readonly translationRuntimeReadiness?: SMR | readonly SMR[];
  readonly translationRuntimeAdapterRequirementId?: string | readonly string[];
  readonly translationRuntimeProofObligationId?: string | readonly string[];
  readonly translationRuntimeProofCapability?: URK | readonly URK[];
  readonly translationRuntimeProofStatus?: string | readonly string[];
  readonly translationRuntimeProofRequiredSignal?: UPS | readonly UPS[];
  readonly translationRuntimeProofProvidedSignal?: UPS | readonly UPS[];
  readonly translationRuntimeProofMissingSignal?: UPS | readonly UPS[];
  readonly translationDialectReadiness?: SMR | readonly SMR[];
  readonly translationDialectRecordId?: string | readonly string[];
  readonly requiredTranslationConstructKind?: QueryFilter<string>; readonly representedTranslationConstructKind?: QueryFilter<string>; readonly targetAdapterId?: QueryFilter<string>;
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
export declare function createUniversalConversionPlanFromFrontierSource(source: string, options?: FrontierSourceUniversalConversionPlanOptions): FrontierSourceUniversalConversionPlan;
export declare function queryUniversalConversionPlan(planOrOptions?: UniversalConversionPlan | UniversalConversionPlanOptions, query?: UniversalConversionPlanQuery): UniversalConversionPlanQueryResult;
