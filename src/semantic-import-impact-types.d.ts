import type { SemanticMergeReadiness, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { NativeImportRegionTaxonomyKind } from './index.js';

export type SemanticImportImpactRisk = 'low' | 'medium' | 'high' | string;
export type SemanticImportImpactConfidence = 'source-exact' | 'source-addressed' | 'estimated-source-region' | 'review-required' | string;

export interface SemanticImportImpactVerificationStep {
  readonly kind: 'dependency-review' | 'source-map-review' | 'reject-or-reprove' | 'proof-review' | 'patch-admission' | 'evidence-review' | string;
  readonly reason: string;
  readonly required: boolean;
}

export interface SemanticImportImpactRecord {
  readonly id: string;
  readonly kind: 'ownership-region-impact' | string;
  readonly ownershipRegionId: string;
  readonly ownershipKey: string;
  readonly regionKind?: NativeImportRegionTaxonomyKind;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly symbolIds: readonly string[];
  readonly symbolNames: readonly string[];
  readonly dependencyRelationIds: readonly string[];
  readonly dependencyPredicates: readonly string[];
  readonly affectedSymbolIds: readonly string[];
  readonly sourceMapMappingIds: readonly string[];
  readonly sourcePreservationRecordIds: readonly string[];
  readonly patchHintIds: readonly string[];
  readonly proofSpecIds: readonly string[];
  readonly proofObligationIds: readonly string[];
  readonly failedProofObligationIds: readonly string[];
  readonly openProofObligationIds: readonly string[];
  readonly paradigmSemanticIds: readonly string[];
  readonly loweringRecordIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly verificationPlan: readonly SemanticImportImpactVerificationStep[];
  readonly conflictKeys: readonly string[];
  readonly readiness: SemanticMergeReadiness;
  readonly risk: SemanticImportImpactRisk;
  readonly confidence: SemanticImportImpactConfidence;
}

export interface SemanticImportImpactSummary {
  readonly kind: 'frontier.lang.semanticImpact';
  readonly version: 1;
  readonly records: readonly SemanticImportImpactRecord[];
  readonly summary: {
    readonly total: number;
    readonly byRisk: Readonly<Record<string, number>>;
    readonly byReadiness: Readonly<Record<string, number>>;
    readonly conflictKeys: readonly string[];
    readonly dependencyRelations: number;
    readonly affectedSymbols: number;
    readonly sourceMapMappings: number;
    readonly sourcePreservationRecords: number;
    readonly patchHints: number;
    readonly proofObligations: number;
    readonly openProofObligations: number;
    readonly failedProofObligations: number;
    readonly paradigmSemantics: number;
    readonly loweringRecords: number;
    readonly evidenceIds: number;
    readonly verificationPlans: readonly string[];
    readonly requiredVerificationSteps: number;
  };
}
