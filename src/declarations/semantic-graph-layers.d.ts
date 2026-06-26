import type { SemanticMergeReadiness, SourceMapMappingRecord, SourceMapRecord } from '@shapeshift-labs/frontier-lang-kernel';
import type { SemanticImportSidecarAdmission, SemanticImportSidecarQuality } from './semantic-sidecar-admission.js';
import type { SemanticImportImpactSummary } from './semantic-impact.js';
import type {
  SemanticImportDependencySummary,
  SemanticImportOwnershipRegion,
  SemanticImportPatchHint,
  SemanticImportSidecar,
  SemanticImportSidecarParadigmSemanticsSummary,
  SemanticImportSidecarProofSpecSummary,
  SemanticImportSidecarSymbol,
  SemanticImportSidecarUniversalAstLayerSummary
} from './semantic-sidecar.js';

export type SemanticGraphLayerKind =
  | 'parser-source-span-trivia'
  | 'scope-use-def'
  | 'module-export-import'
  | 'type-public-api'
  | 'control-flow-effect'
  | 'generic-semantic-edit-admission';
export type SemanticGraphLayerStatus = 'strong' | 'partial' | 'missing' | 'blocked';
export interface SemanticGraphLayerRecord {
  readonly kind: 'frontier.lang.semanticGraphLayer';
  readonly version: 1;
  readonly id: SemanticGraphLayerKind;
  readonly title: string;
  readonly status: SemanticGraphLayerStatus;
  readonly summary: Readonly<Record<string, unknown>>;
  readonly reasonCodes: readonly string[];
  readonly evidenceIds: readonly string[];
}
export interface SemanticGraphLayerSummary {
  readonly kind: 'frontier.lang.semanticGraphLayers';
  readonly version: 1;
  readonly schema: 'frontier.lang.semanticGraphLayers.v1';
  readonly status: 'partial' | 'missing' | 'blocked';
  readonly layerKinds: readonly SemanticGraphLayerKind[];
  readonly layers: {
    readonly parserSourceSpanTrivia: SemanticGraphLayerRecord;
    readonly scopeUseDef: SemanticGraphLayerRecord;
    readonly moduleExportImport: SemanticGraphLayerRecord;
    readonly typePublicApi: SemanticGraphLayerRecord;
    readonly controlFlowEffect: SemanticGraphLayerRecord;
    readonly genericSemanticEditAdmission: SemanticGraphLayerRecord;
  };
  readonly summary: {
    readonly total: number;
    readonly strong: number;
    readonly partial: number;
    readonly missing: number;
    readonly blocked: number;
    readonly usable: number;
    readonly reasonCodes: readonly string[];
    readonly evidenceIds: readonly string[];
  };
  readonly metadata: { readonly note: string };
}
export interface SemanticGraphLayerSummaryInput {
  readonly importResult?: unknown;
  readonly imports?: readonly unknown[];
  readonly symbols?: readonly SemanticImportSidecarSymbol[];
  readonly ownershipRegions?: readonly SemanticImportOwnershipRegion[];
  readonly sourceMaps?: readonly SourceMapRecord[];
  readonly sourceMapMappings?: readonly SourceMapMappingRecord[];
  readonly sourcePreservation?: SemanticImportSidecar['sourcePreservation'];
  readonly universalAstLayers?: SemanticImportSidecarUniversalAstLayerSummary;
  readonly proofSpec?: SemanticImportSidecarProofSpecSummary;
  readonly paradigmSemantics?: SemanticImportSidecarParadigmSemanticsSummary;
  readonly dependencies?: SemanticImportDependencySummary;
  readonly semanticImpact?: SemanticImportImpactSummary;
  readonly patchHints?: readonly SemanticImportPatchHint[];
  readonly quality?: SemanticImportSidecarQuality;
  readonly admission?: SemanticImportSidecarAdmission;
  readonly mergeCandidates?: readonly unknown[];
  readonly readiness?: SemanticMergeReadiness;
}
export declare const SemanticGraphLayerKinds: readonly SemanticGraphLayerKind[];
export declare function createSemanticGraphLayerSummary(input?: SemanticGraphLayerSummaryInput): SemanticGraphLayerSummary;
