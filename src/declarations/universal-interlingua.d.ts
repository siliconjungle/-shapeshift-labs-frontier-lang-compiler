import type {
  FrontierSourceLanguage,
  SemanticMergeReadiness
} from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalInterlinguaLayerKind =
  | 'source-import'
  | 'semantic-symbol'
  | 'source-map'
  | 'parser-feature'
  | 'source-preservation'
  | 'declaration-stub'
  | 'target-adapter'
  | 'runtime-capability'
  | 'dialect-projection'
  | 'semantic-ownership'
  | 'callable-boundary-contract'
  | 'adt-pattern-contract'
  | 'numeric-semantics-contract'
  | 'text-semantics-contract'
  | 'collection-semantics-contract'
  | 'serialization-semantics-contract'
  | 'dependency-semantics-contract'
  | 'protocol-contract'
  | 'proof-evidence'
  | string;

export type UniversalInterlinguaLoweringDisposition =
  | 'exact-source'
  | 'target-adapter'
  | 'declaration-stub'
  | 'semantic-index-only'
  | 'lossy-review'
  | 'blocked';

export type UniversalInterlinguaConstraintEdgeKind =
  | 'resource-transfer'
  | 'ownership'
  | 'lifetime'
  | 'control-flow'
  | 'callable-boundary'
  | 'adt-pattern'
  | 'borrow-scope'
  | 'borrow-checker'
  | 'data-layout'
  | 'concurrency-model'
  | 'error-model'
  | 'evaluation-model'
  | 'host-environment'
  | 'memory-model'
  | 'metaprogramming'
  | 'scope-binding'
  | 'effect'
  | 'module'
  | 'numeric-semantics'
  | 'text-semantics'
  | 'collection-semantics'
  | 'serialization-semantics'
  | 'dependency-semantics'
  | 'object-model'
  | 'protocol'
  | 'type'
  | string;

export interface UniversalInterlinguaLayerSummary {
  readonly kinds: readonly UniversalInterlinguaLayerKind[];
  readonly representedKinds: readonly UniversalInterlinguaLayerKind[];
  readonly missingKinds: readonly UniversalInterlinguaLayerKind[];
  readonly reviewKinds: readonly UniversalInterlinguaLayerKind[];
  readonly blockedKinds: readonly UniversalInterlinguaLayerKind[];
  readonly constructCount: number;
  readonly representedCount: number;
  readonly missingCount: number;
  readonly reviewCount: number;
  readonly blockedCount: number;
}

export interface UniversalInterlinguaConstraintEdge {
  readonly id: string;
  readonly family: UniversalInterlinguaConstraintEdgeKind;
  readonly layerKind: UniversalInterlinguaLayerKind;
  readonly sourceId?: string;
  readonly status?: string;
  readonly action?: string;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly obligations: readonly UniversalInterlinguaConstraintObligation[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly severity: 'info' | 'warning' | 'error' | string;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface UniversalInterlinguaConstraintObligation {
  readonly id: string;
  readonly edgeId: string;
  readonly family: UniversalInterlinguaConstraintEdgeKind;
  readonly kind: string;
  readonly status: 'represented' | 'missing' | 'required' | string;
  readonly sourceId?: string;
  readonly sourceNodeIds: readonly string[];
  readonly targetNodeIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly severity: 'info' | 'warning' | 'error' | string;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface UniversalInterlinguaConstraintSummary {
  readonly edges: readonly UniversalInterlinguaConstraintEdge[];
  readonly edgeCount: number;
  readonly obligations: readonly UniversalInterlinguaConstraintObligation[];
  readonly obligationCount: number;
  readonly families: readonly UniversalInterlinguaConstraintEdgeKind[];
  readonly statuses: readonly string[];
  readonly actions: readonly string[];
  readonly sourceIds: readonly string[];
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly obligationKinds: readonly string[];
  readonly obligationStatuses: readonly string[];
  readonly obligationEvidenceIds: readonly string[];
  readonly obligationMissingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
}

export interface UniversalInterlinguaRecord {
  readonly kind: 'frontier.lang.universalInterlinguaRecord';
  readonly version: 1;
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly lift: {
    readonly sourceLanguage?: FrontierSourceLanguage | string;
    readonly sourceImportIds: readonly string[];
    readonly sourcePaths: readonly string[];
    readonly sourceHashes: readonly string[];
    readonly sourceMapIds: readonly string[];
    readonly sourceMapMappingIds: readonly string[];
    readonly ownershipKeys: readonly string[];
    readonly conflictKeys: readonly string[];
    readonly evidenceIds: readonly string[];
    readonly proofIds: readonly string[];
  };
  readonly layers: UniversalInterlinguaLayerSummary;
  readonly constraints: UniversalInterlinguaConstraintSummary;
  readonly lowering: {
    readonly disposition: UniversalInterlinguaLoweringDisposition;
    readonly mode?: string;
    readonly routeAction?: string;
    readonly lossClass?: string;
    readonly adapterId?: string;
    readonly adapterKind?: string;
    readonly readiness?: SemanticMergeReadiness | string;
    readonly targetSupported: boolean;
    readonly runtimeReadiness?: SemanticMergeReadiness | string;
    readonly runtimeRequiredCapabilities: readonly string[];
    readonly runtimeAdapterRequirementIds: readonly string[];
    readonly dialectReadiness?: SemanticMergeReadiness | string;
    readonly dialectRecordIds: readonly string[];
    readonly dialectProjectionDispositions: readonly string[];
    readonly proofEvidenceIds: readonly string[];
    readonly evidenceIds: readonly string[];
    readonly missingEvidence: readonly string[];
    readonly lossIds: readonly string[];
    readonly blockers: readonly string[];
    readonly review: readonly string[];
  };
  readonly claims: {
    readonly exactSource: boolean;
    readonly adapterMediated: boolean;
    readonly declarationOnly: boolean;
    readonly semanticIndexOnly: boolean;
    readonly lossyReview: boolean;
    readonly blocked: boolean;
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
  };
  readonly query: {
    readonly layerKinds: readonly UniversalInterlinguaLayerKind[];
    readonly representedLayerKinds: readonly UniversalInterlinguaLayerKind[];
    readonly missingLayerKinds: readonly UniversalInterlinguaLayerKind[];
    readonly reviewLayerKinds: readonly UniversalInterlinguaLayerKind[];
    readonly blockedLayerKinds: readonly UniversalInterlinguaLayerKind[];
    readonly constraintFamilies: readonly UniversalInterlinguaConstraintEdgeKind[];
    readonly constraintStatuses: readonly string[];
    readonly constraintActions: readonly string[];
    readonly constraintSourceIds: readonly string[];
    readonly constraintRequiredKinds: readonly string[];
    readonly constraintRepresentedKinds: readonly string[];
    readonly constraintMissingKinds: readonly string[];
    readonly constraintMissingEvidence: readonly string[];
    readonly constraintObligationKinds: readonly string[];
    readonly constraintObligationStatuses: readonly string[];
    readonly constraintObligationEvidenceIds: readonly string[];
    readonly constraintObligationMissingEvidence: readonly string[];
    readonly loweringDisposition: UniversalInterlinguaLoweringDisposition;
    readonly missingEvidence: readonly string[];
    readonly proofEvidenceIds: readonly string[];
    readonly targetAdapterId?: string;
  };
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface UniversalInterlinguaQuery {
  readonly interlinguaLayerKind?: UniversalInterlinguaLayerKind | readonly UniversalInterlinguaLayerKind[];
  readonly interlinguaRepresentedLayerKind?: UniversalInterlinguaLayerKind | readonly UniversalInterlinguaLayerKind[];
  readonly interlinguaMissingLayerKind?: UniversalInterlinguaLayerKind | readonly UniversalInterlinguaLayerKind[];
  readonly interlinguaReviewLayerKind?: UniversalInterlinguaLayerKind | readonly UniversalInterlinguaLayerKind[];
  readonly interlinguaBlockedLayerKind?: UniversalInterlinguaLayerKind | readonly UniversalInterlinguaLayerKind[];
  readonly interlinguaConstraintFamily?: UniversalInterlinguaConstraintEdgeKind | readonly UniversalInterlinguaConstraintEdgeKind[];
  readonly interlinguaConstraintStatus?: string | readonly string[];
  readonly interlinguaConstraintAction?: string | readonly string[];
  readonly interlinguaConstraintSourceId?: string | readonly string[];
  readonly interlinguaConstraintRequiredKind?: string | readonly string[];
  readonly interlinguaConstraintRepresentedKind?: string | readonly string[];
  readonly interlinguaConstraintMissingKind?: string | readonly string[];
  readonly interlinguaConstraintMissingEvidence?: string | readonly string[];
  readonly interlinguaConstraintObligationKind?: string | readonly string[];
  readonly interlinguaConstraintObligationStatus?: string | readonly string[];
  readonly interlinguaConstraintObligationEvidenceId?: string | readonly string[];
  readonly interlinguaConstraintObligationMissingEvidence?: string | readonly string[];
  readonly interlinguaLoweringDisposition?: UniversalInterlinguaLoweringDisposition | readonly UniversalInterlinguaLoweringDisposition[];
  readonly interlinguaMissingEvidence?: string | readonly string[];
  readonly interlinguaProofEvidenceId?: string | readonly string[];
  readonly interlinguaTargetAdapterId?: string | readonly string[];
}

export declare const UniversalInterlinguaLayerKinds: readonly UniversalInterlinguaLayerKind[];
export declare const UniversalInterlinguaLoweringDispositions: readonly UniversalInterlinguaLoweringDisposition[];
export declare const UniversalInterlinguaConstraintEdgeKinds: readonly UniversalInterlinguaConstraintEdgeKind[];
export declare function createUniversalInterlinguaRecord(input?: Record<string, unknown>): UniversalInterlinguaRecord;
export declare function interlinguaRecordMatches(
  record?: UniversalInterlinguaRecord,
  query?: UniversalInterlinguaQuery
): boolean;
