import type {
  CapabilityAdapterBinding,
  CapabilityUnsupportedTarget,
  CompileTarget,
  EvidenceRecord,
  FrontierLangDocument,
  FrontierUniversalAstEnvelope,
  FrontierSourceLanguage,
  LanguageImportResult,
  NativeAstLossRecord,
  NativeAstNode,
  NativeAstRecord,
  NativeSourceNode,
  SemanticMergeCandidateRecord,
  SemanticMergeReadiness,
  SemanticIndexRecord,
  SemanticNode,
  SemanticPatchBundle,
  SourceMapMappingRecord,
  SourceMapRecord,
  SourcePreservationLevel,
  SourcePreservationRecord,
  SourceSpan,
  UniversalAstLayerMap,
  UniversalAstLayerRecord
} from '@shapeshift-labs/frontier-lang-kernel';
import type { SemanticImportSidecarAdmission, SemanticImportSidecarQuality } from './semantic-sidecar-admission.js';
import type { SemanticMergeConflictClass, SemanticMergeConflictSummary } from './semantic-merge-conflicts.js';
import type { Diagnostic } from '@shapeshift-labs/frontier-lang-checker';
import type { EmitTypeScriptOptions, TypeScriptAstModule, TypeScriptDocumentSourceMapResult, TypeScriptGeneratedSourceMapResult } from '@shapeshift-labs/frontier-lang-typescript';
import type { EmitJavaScriptOptions, EmitJavaScriptWithSourceMapResult, JavaScriptAstModule, JavaScriptSourceMapResult } from '@shapeshift-labs/frontier-lang-javascript';
import type { EmitRustOptions, EmitRustWithSourceMapResult, RustAstModule, RustSourceMapResult } from '@shapeshift-labs/frontier-lang-rust';
import type { EmitPythonOptions, EmitPythonWithSourceMapResult, PythonAstModule, PythonSourceMapResult } from '@shapeshift-labs/frontier-lang-python';
import type { CAstHeader, CSourceMapResult, EmitCHeaderOptions, EmitCHeaderWithSourceMapResult } from '@shapeshift-labs/frontier-lang-c';
import type { FrontierCompileTarget, FrontierCompileEmitOptions, FrontierTargetAst, FrontierTargetSourceMapResult, FrontierTargetDocumentSourceMapResult, FrontierCompileOptions, FrontierCompileResult, CapabilityResolution } from './compile.js';
import type { NativeImportTaxonomyKind, NativeImportKnownLossKind, NativeImportRegionTaxonomyKind, NativeImportLossSummaryOptions, NativeImportFeatureEvidenceRisk, NativeImportFeatureEvidencePolicy, NativeImportFeatureEvidenceIssue, NativeImportFeatureEvidenceSummary, NativeImportLossSummary, NativeImportReadinessClassification, NativeImportLanguageProfile } from './native-import-losses.js';
import type { NativeParserAstFormatKind, NativeParserAstFormatProfile, NativeParserAstFormatCoverage, NativeParserAstFormatMatrix, NativeParserAstFormatMatrixOptions } from './native-parser-formats.js';
import type { NativeParserFeatureCategory, NativeParserFeatureCoverageStatus, NativeParserFeatureCoverage, NativeParserFeatureCoverageMap, NativeParserFeatureMergeAssessment, NativeParserFeatureParserRow, NativeParserFeatureLanguageSummary, NativeParserFeatureMatrix, NativeParserFeatureMatrixOptions, NativeParserFeatureMatrixQuery, NativeParserFeatureMatrixQueryResult, NativeImporterAdapterCoverageAggregate } from './native-parser-features.js';
import type { NativeImportCoverageLanguage, NativeImportCoverageMatrix, NativeImportCoverageMatrixOptions } from './native-import-coverage.js';
import type { ProjectionTargetLossClass, ProjectionSourceProjectionCoverage, ProjectionTargetCoverageEntry, ProjectionTargetLanguageCoverage, ProjectionTargetLossMatrix, ProjectionTargetLossMatrixOptions } from './projection-coverage.js';
import type { UniversalCapabilityLanguageRow, UniversalCapabilityMatrix, UniversalCapabilityMatrixOptions } from './universal-capability.js';
import type { NativeImportContractSource, NativeImportSourcePreservationRecordSummary, NativeImportSourcePreservationContract, NativeImportAdapterCoverageRecordSummary, NativeImportAdapterCoverageContract, NativeImportRegionSummary, NativeImportSourceMapSummary, NativeImportReadinessContract, NativeImportResultContract, NativeImportResultContractOptions } from './native-import-contracts.js';
import type { NativeSourceTokenKind, NativeSourcePreservedToken, NativeSourcePreservedDirective, NativeSourcePreservation, CreateNativeSourcePreservationOptions } from './source-preservation.js';
import type { NativeSourceChangeKind, NativeSourceChangeProjectionEndpoint, NativeSourceChangeProjectionSourceMapLink, NativeSourceChangeProjectionMetadata, NativeSourceChangeProjectionSummary, NativeSourceChangeSymbol, NativeSourceChangeRegion, NativeSourceChangeSummary, DiffNativeSourceImportsOptions, DiffNativeSourcesOptions, NativeSourceChangeSet } from './native-diff.js';
import type { SemanticSliceInput, CreateSemanticSliceOptions, SemanticSliceSourceMapLink, SemanticSliceSourceFile, SemanticSliceExpectedAssertion, SemanticSlice, TestSemanticSliceOptions, SemanticSliceTestAssertion, SemanticSliceTestResult } from './semantic-slice.js';
import type { NativeImporterAdapterExactness, NativeImporterAdapterSemanticCoverage, NativeImporterAdapterCoverageSnapshot, NativeImporterAdapterCoverageObserved, NativeImporterAdapterCoverageCapabilityRow, NativeImporterAdapterCoverageCapabilityEvidence, NativeImporterAdapterCoverageSummary, NativeImporterAdapterCoverageInput } from './adapter-coverage.js';
import type { NativeImporterAdapterDiagnostic, ImportNativeSourceOptions, NativeSourceImportResult, ExternalSemanticIndexFormat, ImportExternalSemanticIndexOptions, ExternalSemanticIndexImportSummary, ExternalSemanticIndexImportResult, NativeImporterAdapterParseInput, NativeImporterAdapterParseResult, NativeImporterAdapter, NativeImporterAdapterSummary, RunNativeImporterAdapterOptions, NativeImporterAdapterImportResult } from './import-adapter-core.js';
import type { JavaScriptNativeImporterAdapterOptions, TypeScriptCompilerNativeImporterAdapterOptions, PythonAstNativeImporterAdapterOptions, RustSynNativeImporterAdapterOptions, ClangAstNativeImporterAdapterOptions, GoAstNativeImporterAdapterOptions } from './import-adapter-options-native.js';
import type { JavaAstNativeImporterAdapterOptions, KotlinPsiNativeImporterAdapterOptions, CSharpRoslynNativeImporterAdapterOptions, SwiftSyntaxNativeImporterAdapterOptions, TreeSitterNativeImporterAdapterOptions } from './import-adapter-options-platform.js';
import type { NativeTargetProjectionAdapterCoverageInput, NativeTargetProjectionAdapterSummary, NativeTargetProjectionAdapterInput, NativeTargetProjectionAdapterResult, NativeTargetProjectionAdapter, NativeTargetProjectionAdapterResolverInput, NativeTargetProjectionResult } from './target-adapters.js';
import type { NativeProjectSourceInput, ImportNativeProjectOptions, NativeProjectImportResult, NativeSourceProjectionMode, ProjectNativeImportToSourceOptions, NativeSourceProjectionDeclaration, NativeSourceProjectionResult, NativeSourceCompileOutputMode, CompileNativeSourceOptions, NativeSourceCompileResult } from './native-project.js';
import type { NativeImportRoundtripReadinessStatus, NativeImportRoundtripReadinessOptions, NativeImportRoundtripReadinessClassification } from './roundtrip.js';

export interface SemanticImportOwnershipRegion {
  readonly id: string;
  readonly key: string;
  readonly regionKind?: NativeImportRegionTaxonomyKind;
  readonly granularity: 'symbol' | string;
  readonly language?: FrontierSourceLanguage | string;
  readonly documentId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly symbolKind?: string;
  readonly nativeAstNodeId?: string;
  readonly sourceSpan?: SourceSpan;
  readonly precision?: 'exact' | 'declaration' | 'line' | 'estimated' | 'unknown' | string;
  readonly mergePolicy?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticImportSidecarSymbol {
  readonly id: string;
  readonly name?: string;
  readonly kind?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly nativeAstNodeId?: string;
  readonly semanticOccurrenceId?: string;
  readonly sourceMapMappingId?: string;
  readonly sourceSpan?: SourceSpan;
  readonly signatureHash?: string;
  readonly ownershipRegionId: string;
  readonly ownershipKey: string;
  readonly ownershipRegionKind?: NativeImportRegionTaxonomyKind;
  readonly readiness: SemanticMergeReadiness;
}

export interface SemanticImportRegionTaxonomySummary {
  readonly kinds: readonly NativeImportRegionTaxonomyKind[];
  readonly presentKinds: readonly NativeImportRegionTaxonomyKind[];
  readonly byKind: Readonly<Record<string, number>>;
  readonly keys: readonly string[];
  readonly keysByKind: Readonly<Record<string, readonly string[]>>;
}

export interface SemanticImportPatchHint {
  readonly id: string;
  readonly kind: 'source-region-patch' | string;
  readonly ownershipRegionId: string;
  readonly ownershipKey: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly readiness: SemanticMergeReadiness;
  readonly precision?: string;
  readonly supportedOperations: readonly string[];
  readonly projection: {
    readonly sourceLanguage?: FrontierSourceLanguage | string;
    readonly targetPath?: string;
    readonly requiresSourceMap: boolean;
  };
}

export interface SemanticImportSidecarImportEntry {
  readonly id: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly parser?: string;
  readonly nativeSourceId?: string;
  readonly nativeAstId?: string;
  readonly semanticIndexId?: string;
  readonly universalAstId?: string;
  readonly symbolCount: number;
  readonly sourceMapCount: number;
  readonly sourceMapMappingCount: number;
  readonly sourcePreservationRecordCount: number;
  readonly sourcePreservationLevels: readonly SourcePreservationLevel[];
  readonly universalAstLayerCount: number;
  readonly universalAstLayerNames: readonly string[];
  readonly universalAstLayerIds: readonly string[];
  readonly proofSpec: SemanticImportSidecarProofSpecSummary;
  readonly paradigmSemantics: SemanticImportSidecarParadigmSemanticsSummary;
  readonly dependencyRelationCount: number; readonly dependencyPredicates: readonly string[];
  readonly readiness: SemanticMergeReadiness;
  readonly emptySemanticIndex: boolean;
  readonly regionTaxonomy?: SemanticImportRegionTaxonomySummary;
}

export interface SemanticImportSidecarSourcePreservationRecord {
  readonly id: string;
  readonly level: SourcePreservationLevel;
  readonly precision?: string;
  readonly sourceMapId?: string;
  readonly sourceMapMappingId?: string;
  readonly semanticNodeId?: string;
  readonly nativeSourceId?: string;
  readonly nativeAstNodeId?: string;
  readonly semanticSymbolId?: string;
  readonly semanticOccurrenceId?: string;
  readonly sourcePath?: string;
  readonly generatedPath?: string;
  readonly lossIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly reasons: readonly string[];
}

export interface SemanticImportSidecarUniversalAstLayerSummary {
  readonly total: number;
  readonly names: readonly string[];
  readonly ids: readonly string[];
  readonly byName: Readonly<Record<string, number>>;
  readonly empty: boolean;
}

export interface SemanticImportSidecarProofSpecSummary {
  readonly total: number;
  readonly ids: readonly string[];
  readonly contracts: number;
  readonly refinements: number;
  readonly invariants: number;
  readonly termination: number;
  readonly temporal: number;
  readonly obligations: number;
  readonly artifacts: number;
  readonly assumptions: number;
  readonly evidence: number;
  readonly discharged: number;
  readonly pending?: number;
  readonly failed: number;
  readonly open: number;
  readonly unknown: number;
  readonly stale: number;
  readonly assumed: number;
  readonly externalToolRequired?: number;
  readonly contractKinds: readonly string[];
  readonly artifactKinds: readonly string[];
  readonly byStatus: Readonly<Record<string, number>>;
  readonly byReadinessStatus?: Readonly<Record<string, number>>;
  readonly byContractKind: Readonly<Record<string, number>>;
  readonly byArtifactKind: Readonly<Record<string, number>>;
  readonly empty: boolean;
}

export interface SemanticImportSidecarParadigmSemanticsSummary {
  readonly total: number;
  readonly ids: readonly string[];
  readonly groups: readonly string[];
  readonly kinds: readonly string[];
  readonly evidence: number;
  readonly bindingScopes: number;
  readonly bindings: number;
  readonly patterns: number;
  readonly typeConstraints: number;
  readonly evaluationModels: number;
  readonly memoryLocations: number;
  readonly effectRegions: number;
  readonly controlRegions: number;
  readonly logicPrograms: number;
  readonly actorSystems: number;
  readonly stackEffects: number;
  readonly arrayShapes: number;
  readonly numericKernels: number;
  readonly dataflowNetworks: number;
  readonly clockModels: number;
  readonly objectModels: number;
  readonly macroExpansions: number;
  readonly reflectionBoundaries: number;
  readonly loweringRecords: number;
  readonly byGroup: Readonly<Record<string, number>>;
  readonly byKind: Readonly<Record<string, number>>;
  readonly hasRuntimeSemantics: boolean;
  readonly hasLogicSemantics: boolean;
  readonly hasStackSemantics: boolean;
  readonly hasArraySemantics: boolean;
  readonly hasMacroOrReflection: boolean;
  readonly hasLowering: boolean;
  readonly empty: boolean;
}

export interface SemanticImportDependencySummary {
  readonly total: number; readonly calls: number; readonly uses: number; readonly references: number;
  readonly imports: number; readonly extends: number; readonly implements: number; readonly includes: number; readonly requires: number;
  readonly byPredicate: Readonly<Record<string, number>>; readonly predicates: readonly string[];
  readonly ids: readonly string[]; readonly sourceSymbolIds: readonly string[]; readonly targetSymbolIds: readonly string[];
}

export interface SemanticImportSidecar {
  readonly kind: 'frontier.lang.semanticImportSidecar';
  readonly version: 1;
  readonly id: string;
  readonly generatedAt: number;
  readonly language?: FrontierSourceLanguage | 'mixed' | string;
  readonly projectRoot?: string;
  readonly imports: readonly SemanticImportSidecarImportEntry[];
  readonly symbols: readonly SemanticImportSidecarSymbol[];
  readonly ownershipRegions: readonly SemanticImportOwnershipRegion[];
  readonly sourceMaps: { readonly total: number; readonly mappings: number; readonly ids: readonly string[] };
  readonly sourcePreservation: {
    readonly total: number;
    readonly ids: readonly string[];
    readonly byLevel: Readonly<Record<string, number>>;
    readonly exact: number;
    readonly declaration: number;
    readonly estimated: number;
    readonly blocked: number;
    readonly sourcePaths: readonly string[];
    readonly sourceMapIds: readonly string[];
    readonly sourceMapMappingIds: readonly string[];
    readonly records: readonly SemanticImportSidecarSourcePreservationRecord[];
  };
  readonly universalAstLayers: SemanticImportSidecarUniversalAstLayerSummary;
  readonly proofSpec: SemanticImportSidecarProofSpecSummary;
  readonly paradigmSemantics: SemanticImportSidecarParadigmSemanticsSummary;
  readonly dependencies: SemanticImportDependencySummary;
  readonly patchHints: readonly SemanticImportPatchHint[];
  readonly quality: SemanticImportSidecarQuality;
  readonly admission: SemanticImportSidecarAdmission;
  readonly mergeCandidates: readonly {
    readonly id?: string;
    readonly readiness?: SemanticMergeReadiness;
    readonly reasons: readonly string[];
    readonly conflictClasses?: readonly SemanticMergeConflictClass[];
    readonly conflictSummary?: SemanticMergeConflictSummary;
    readonly risk?: string;
    readonly operationCount: number;
  }[];
  readonly losses: {
    readonly total: number;
    readonly byKind: Readonly<Record<string, number>>;
    readonly bySeverity: Readonly<Record<string, number>>;
    readonly categories: readonly NativeImportTaxonomyKind[];
    readonly blockingLossIds: readonly string[];
    readonly reviewLossIds: readonly string[];
  };
  readonly regionTaxonomy: SemanticImportRegionTaxonomySummary;
  readonly evidence: { readonly total: number; readonly failed: readonly string[]; readonly ids: readonly string[] };
  readonly summary: {
    readonly imports: number;
    readonly symbols: number;
    readonly ownershipRegions: number;
    readonly regionKinds: number;
    readonly sourceMapMappings: number;
    readonly sourcePreservationRecords: number;
    readonly universalAstLayers: number;
    readonly universalAstLayerNames: readonly string[];
    readonly proofSpecRecords: number;
    readonly proofSpecObligations: number;
    readonly proofSpecFailedObligations: number;
    readonly paradigmSemanticsRecords: number;
    readonly paradigmSemanticsGroups: number;
    readonly paradigmSemanticsLoweringRecords: number;
    readonly dependencyRelations: number; readonly dependencyPredicates: readonly string[];
    readonly patchHints: number;
    readonly evidenceWarnings: number;
    readonly semanticImportExpected: boolean; readonly semanticImportExpectedSatisfied: boolean; readonly semanticImportExpectedMissingReasonCodes: readonly string[];
    readonly readiness: SemanticMergeReadiness; readonly emptySemanticIndex: boolean;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticImportSidecarOptions {
  readonly id?: string;
  readonly generatedAt?: number;
  readonly regionPrefix?: string;
  readonly targetPath?: string; readonly expected?: boolean; readonly semanticImportExpected?: boolean;
  readonly metadata?: Record<string, unknown>;
}
