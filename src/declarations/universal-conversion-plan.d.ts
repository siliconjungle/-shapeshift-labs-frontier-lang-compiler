import type { EvidenceRecord, FrontierSourceLanguage as SL, SemanticMergeReadiness as SMR } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget as CT } from './compile.js';
import type { NativeImportKnownLossKind } from './native-import-losses.js';
import type { NativeParserFeatureCategory } from './native-parser-features.js';
import type { ProjectionSourceProjectionCoverage, ProjectionTargetCoverageEntry } from './projection-coverage.js';
import type { ProjectionReadinessTargetCell } from './projection-readiness.js';
import type { UniversalCapabilityMatrix as UCM, UniversalCapabilityMatrixOptions as UCO } from './universal-capability.js';
import type { UniversalRepresentationCoverage as URC, UniversalRepresentationCoverageQuery as URCQ } from './universal-representation-coverage.js';
import type { UniversalInterlinguaQuery, UniversalInterlinguaRecord } from './universal-interlingua.js';
import type { UniversalConversionPlanCompactCounts } from './universal-conversion-compact-counts.js';
import type { UniversalRuntimeAdapterRequirement as URA, UniversalRuntimeCapabilityKind as URK, UniversalRuntimeCapabilityMatrix as URM, UniversalRuntimeCapabilityRoute as URR, UniversalRuntimeHostProfile as URH, UniversalRuntimeRequirementInput as URI } from './universal-runtime-capabilities.js';
import type { UniversalBorrowCheckerConstraintEvidence as BcEv, UniversalBorrowCheckerConstraintInput as BcIn, UniversalBorrowCheckerConstraintQuery as BcQ } from './universal-borrow-checker-constraints.js';
import type { UniversalBorrowScopeConstraintEvidence as BsEv, UniversalBorrowScopeConstraintInput as BsIn, UniversalBorrowScopeConstraintQuery as BsQ } from './universal-borrow-scope-constraints.js';
import type { UniversalControlFlowConstraintEvidence as CfEv, UniversalControlFlowConstraintInput as CfIn, UniversalControlFlowConstraintQuery as CfQ } from './universal-control-flow-constraints.js';
import type { UniversalAdtPatternConstraintEvidence as AdtEv, UniversalAdtPatternConstraintInput as AdtIn, UniversalAdtPatternConstraintQuery as AdtQ } from './universal-adt-pattern-constraints.js';
import type { UniversalEffectConstraintEvidence as EfEv, UniversalEffectConstraintInput as EfIn, UniversalEffectConstraintQuery as EfQ } from './universal-effect-constraints.js'; import type { UniversalConcurrencyModelConstraintEvidence as ConEv, UniversalConcurrencyModelConstraintInput as ConIn, UniversalConcurrencyModelConstraintQuery as ConQ } from './universal-concurrency-model-constraints.js'; import type { UniversalDataLayoutConstraintEvidence as DlEv, UniversalDataLayoutConstraintInput as DlIn, UniversalDataLayoutConstraintQuery as DlQ } from './universal-data-layout-constraints.js'; import type { UniversalErrorModelConstraintEvidence as ErrEv, UniversalErrorModelConstraintInput as ErrIn, UniversalErrorModelConstraintQuery as ErrQ } from './universal-error-model-constraints.js'; import type { UniversalEvaluationModelConstraintEvidence as EvalEv, UniversalEvaluationModelConstraintInput as EvalIn, UniversalEvaluationModelConstraintQuery as EvalQ } from './universal-evaluation-model-constraints.js'; import type { UniversalObjectModelConstraintEvidence as ObjEv, UniversalObjectModelConstraintInput as ObjIn, UniversalObjectModelConstraintQuery as ObjQ } from './universal-object-model-constraints.js';
import type { UniversalHostEnvironmentConstraintEvidence as HostEv, UniversalHostEnvironmentConstraintInput as HostIn, UniversalHostEnvironmentConstraintQuery as HostQ } from './universal-host-environment-constraints.js';
import type { UniversalLifetimeConstraintEvidence as LtEv, UniversalLifetimeConstraintInput as LtIn, UniversalLifetimeConstraintQuery as LtQ } from './universal-lifetime-constraints.js'; import type { UniversalMemoryModelConstraintEvidence as MemEv, UniversalMemoryModelConstraintInput as MemIn, UniversalMemoryModelConstraintQuery as MemQ } from './universal-memory-model-constraints.js';
import type { UniversalMetaprogrammingConstraintEvidence as MetaEv, UniversalMetaprogrammingConstraintInput as MetaIn, UniversalMetaprogrammingConstraintQuery as MetaQ } from './universal-metaprogramming-constraints.js';
import type { UniversalScopeBindingConstraintEvidence as SbEv, UniversalScopeBindingConstraintInput as SbIn, UniversalScopeBindingConstraintQuery as SbQ } from './universal-scope-binding-constraints.js';
import type { UniversalModuleConstraintEvidence as ModEv, UniversalModuleConstraintInput as ModIn, UniversalModuleConstraintQuery as ModQ } from './universal-module-constraints.js';
import type { UniversalNumericSemanticsConstraintEvidence as NumEv, UniversalNumericSemanticsConstraintInput as NumIn, UniversalNumericSemanticsConstraintQuery as NumQ } from './universal-numeric-semantics-constraints.js';
import type { UniversalTypeConstraintEvidence as TyEv, UniversalTypeConstraintInput as TyIn, UniversalTypeConstraintQuery as TyQ } from './universal-type-constraints.js';
import type { UniversalProtocolConstraintEvidence as ProtoEv, UniversalProtocolConstraintInput as ProtoIn, UniversalProtocolConstraintQuery as ProtoQ } from './universal-protocol-constraints.js';
import type { UniversalResourceTransferEvidence as ResEv, UniversalResourceTransferInput as ResIn, UniversalResourceTransferQuery as ResQ } from './universal-resource-transfer.js';
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
export interface UniversalTranslationConstraintSummary { readonly id?: string; readonly status?: string; readonly action?: string; readonly requiredKinds: RO<string>; readonly representedKinds: RO<string>; readonly missingKinds: RO<string>; readonly missingEvidence: RO<string>; } type TCS = UniversalTranslationConstraintSummary; type RO<T> = readonly T[]; type Rdy = SMR|string; type TCN = 'lifetimeConstraint'|'controlFlowConstraint'|'adtPatternConstraint'|'borrowScopeConstraint'|'borrowCheckerConstraint'|'dataLayoutConstraint'|'effectConstraint'|'concurrencyModelConstraint'|'errorModelConstraint'|'evaluationModelConstraint'|'hostEnvironmentConstraint'|'memoryModelConstraint'|'metaprogrammingConstraint'|'scopeBindingConstraint'|'moduleConstraint'|'numericSemanticsConstraint'|'objectModelConstraint'|'protocolConstraint'|'typeConstraint'; type TCF = { readonly [K in TCN]?: TCS } & { readonly [K in `${TCN}Status`]?: string } & { readonly [K in `${TCN}Action`]?: string } & { readonly [K in `${TCN}MissingEvidence`]: RO<string> };
export interface UniversalTranslationAdmission extends TCF {
  readonly status: UniversalTranslationAdmissionStatus; readonly action: UniversalTranslationAdmissionAction;
  readonly requiredConstructKinds: RO<string>; readonly representedConstructKinds: RO<string>; readonly missingConstructKinds: RO<string>; readonly missingEvidence: RO<string>;
  readonly blockers: RO<string>; readonly review: RO<string>; readonly evidenceIds: RO<string>; readonly proofEvidenceIds: RO<string>;
  readonly runtimeReadiness: Rdy; readonly runtimeAdapterRequirementIds: RO<string>; readonly dialectReadiness: Rdy; readonly dialectRecordIds: RO<string>;
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

export interface UniversalConversionRoute {
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
  readonly resourceTransfer?: ResEv; readonly lifetimeConstraint?: LtEv; readonly controlFlowConstraint?: CfEv; readonly adtPatternConstraint?: AdtEv; readonly borrowScopeConstraint?: BsEv; readonly borrowCheckerConstraint?: BcEv; readonly dataLayoutConstraint?: DlEv; readonly effectConstraint?: EfEv; readonly concurrencyModelConstraint?: ConEv; readonly errorModelConstraint?: ErrEv; readonly evaluationModelConstraint?: EvalEv; readonly hostEnvironmentConstraint?: HostEv; readonly memoryModelConstraint?: MemEv; readonly metaprogrammingConstraint?: MetaEv; readonly scopeBindingConstraint?: SbEv; readonly moduleConstraint?: ModEv; readonly numericSemanticsConstraint?: NumEv; readonly objectModelConstraint?: ObjEv; readonly protocolConstraint?: ProtoEv; readonly typeConstraint?: TyEv;
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

export interface UniversalConversionPlanOptions extends UCO {
  readonly id?: string;
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
  readonly resourceTransfer?: ResIn | ResEv; readonly translationResourceTransfer?: ResIn | ResEv; readonly resourceTransfers?: readonly (ResIn | ResEv)[];
  readonly lifetimeConstraint?: LtIn | LtEv; readonly translationLifetimeConstraint?: LtIn | LtEv; readonly lifetimeConstraints?: readonly (LtIn | LtEv)[];
  readonly controlFlowConstraint?: CfIn | CfEv; readonly translationControlFlowConstraint?: CfIn | CfEv; readonly controlFlowConstraints?: readonly (CfIn | CfEv)[];
  readonly adtPatternConstraint?: AdtIn | AdtEv; readonly translationAdtPatternConstraint?: AdtIn | AdtEv; readonly adtPatternConstraints?: readonly (AdtIn | AdtEv)[];
  readonly borrowScopeConstraint?: BsIn | BsEv; readonly translationBorrowScopeConstraint?: BsIn | BsEv; readonly borrowScopeConstraints?: readonly (BsIn | BsEv)[];
  readonly borrowCheckerConstraint?: BcIn | BcEv; readonly translationBorrowCheckerConstraint?: BcIn | BcEv; readonly borrowCheckerConstraints?: readonly (BcIn | BcEv)[];
  readonly dataLayoutConstraint?: DlIn | DlEv; readonly translationDataLayoutConstraint?: DlIn | DlEv; readonly dataLayoutConstraints?: readonly (DlIn | DlEv)[]; readonly effectConstraint?: EfIn | EfEv; readonly translationEffectConstraint?: EfIn | EfEv; readonly effectConstraints?: readonly (EfIn | EfEv)[]; readonly concurrencyModelConstraint?: ConIn | ConEv; readonly translationConcurrencyModelConstraint?: ConIn | ConEv; readonly concurrencyModelConstraints?: readonly (ConIn | ConEv)[]; readonly errorModelConstraint?: ErrIn | ErrEv; readonly translationErrorModelConstraint?: ErrIn | ErrEv; readonly errorModelConstraints?: readonly (ErrIn | ErrEv)[]; readonly evaluationModelConstraint?: EvalIn | EvalEv; readonly translationEvaluationModelConstraint?: EvalIn | EvalEv; readonly evaluationModelConstraints?: readonly (EvalIn | EvalEv)[]; readonly hostEnvironmentConstraint?: HostIn | HostEv; readonly translationHostEnvironmentConstraint?: HostIn | HostEv; readonly hostEnvironmentConstraints?: readonly (HostIn | HostEv)[]; readonly memoryModelConstraint?: MemIn | MemEv; readonly translationMemoryModelConstraint?: MemIn | MemEv; readonly memoryModelConstraints?: readonly (MemIn | MemEv)[];
  readonly metaprogrammingConstraint?: MetaIn | MetaEv; readonly translationMetaprogrammingConstraint?: MetaIn | MetaEv; readonly metaprogrammingConstraints?: readonly (MetaIn | MetaEv)[]; readonly scopeBindingConstraint?: SbIn | SbEv; readonly translationScopeBindingConstraint?: SbIn | SbEv; readonly scopeBindingConstraints?: readonly (SbIn | SbEv)[]; readonly moduleConstraint?: ModIn | ModEv; readonly translationModuleConstraint?: ModIn | ModEv; readonly moduleConstraints?: readonly (ModIn | ModEv)[]; readonly numericSemanticsConstraint?: NumIn | NumEv; readonly translationNumericSemanticsConstraint?: NumIn | NumEv; readonly numericSemanticsConstraints?: readonly (NumIn | NumEv)[]; readonly objectModelConstraint?: ObjIn | ObjEv; readonly translationObjectModelConstraint?: ObjIn | ObjEv; readonly objectModelConstraints?: readonly (ObjIn | ObjEv)[]; readonly protocolConstraint?: ProtoIn | ProtoEv; readonly translationProtocolConstraint?: ProtoIn | ProtoEv; readonly protocolConstraints?: readonly (ProtoIn | ProtoEv)[];
  readonly typeConstraint?: TyIn | TyEv; readonly translationTypeConstraint?: TyIn | TyEv; readonly typeConstraints?: readonly (TyIn | TyEv)[];
  readonly runtimeRequirements?: readonly (URK | URI)[];
  readonly requiredRuntimeCapabilities?: UniversalConversionPlanOptions['runtimeRequirements'];
  readonly effects?: UniversalConversionPlanOptions['runtimeRequirements'];
  readonly evidence?: readonly EvidenceRecord[];
}
export interface UniversalConversionPlanQuery extends URCQ, UniversalInterlinguaQuery, ResQ, LtQ, CfQ, AdtQ, BsQ, BcQ, DlQ, EfQ, ConQ, ErrQ, EvalQ, HostQ, MemQ, MetaQ, SbQ, ModQ, NumQ, ObjQ, ProtoQ, TyQ {
  readonly sourceLanguage?: SL | string;
  readonly language?: SL | string;
  readonly target?: CT | string;
  readonly mode?: UniversalConversionRouteMode;
  readonly readiness?: SMR;
  readonly admissionAction?: UniversalConversionAdmissionAction;
  readonly runtimeRouteId?: string;
  readonly sourceHostId?: string;
  readonly targetHostId?: string;
  readonly sourceRuntime?: string;
  readonly runtime?: string;
  readonly targetRuntime?: string;
  readonly runtimeReadiness?: SMR;
  readonly missingRuntimeCapability?: URK;
  readonly runtimeAdapterRequirementId?: string;
  readonly dialectReadiness?: SMR;
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
export declare function queryUniversalConversionPlan(planOrOptions?: UniversalConversionPlan | UniversalConversionPlanOptions, query?: UniversalConversionPlanQuery): UniversalConversionPlanQueryResult;
