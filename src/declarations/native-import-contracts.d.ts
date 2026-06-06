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
import type { NativeSourceTokenKind, NativeSourcePreservedToken, NativeSourcePreservedDirective, NativeSourcePreservation, CreateNativeSourcePreservationOptions } from './source-preservation.js';
import type { SemanticImportOwnershipRegion, SemanticImportSidecarSymbol, SemanticImportRegionTaxonomySummary, SemanticImportPatchHint, SemanticImportSidecarImportEntry, SemanticImportSidecarSourcePreservationRecord, SemanticImportSidecarUniversalAstLayerSummary, SemanticImportSidecarProofSpecSummary, SemanticImportSidecarParadigmSemanticsSummary, SemanticImportSidecar, SemanticImportSidecarOptions } from './semantic-sidecar.js';
import type { NativeSourceChangeKind, NativeSourceChangeProjectionEndpoint, NativeSourceChangeProjectionSourceMapLink, NativeSourceChangeProjectionMetadata, NativeSourceChangeProjectionSummary, NativeSourceChangeSymbol, NativeSourceChangeRegion, NativeSourceChangeSummary, DiffNativeSourceImportsOptions, DiffNativeSourcesOptions, NativeSourceChangeSet } from './native-diff.js';
import type { SemanticSliceInput, CreateSemanticSliceOptions, SemanticSliceSourceMapLink, SemanticSliceSourceFile, SemanticSliceExpectedAssertion, SemanticSlice, TestSemanticSliceOptions, SemanticSliceTestAssertion, SemanticSliceTestResult } from './semantic-slice.js';
import type { NativeImporterAdapterExactness, NativeImporterAdapterSemanticCoverage, NativeImporterAdapterCoverageSnapshot, NativeImporterAdapterCoverageObserved, NativeImporterAdapterCoverageCapabilityRow, NativeImporterAdapterCoverageCapabilityEvidence, NativeImporterAdapterCoverageSummary, NativeImporterAdapterCoverageInput } from './adapter-coverage.js';
import type { NativeImporterAdapterDiagnostic, ImportNativeSourceOptions, NativeSourceImportResult, ExternalSemanticIndexFormat, ImportExternalSemanticIndexOptions, ExternalSemanticIndexImportSummary, ExternalSemanticIndexImportResult, NativeImporterAdapterParseInput, NativeImporterAdapterParseResult, NativeImporterAdapter, NativeImporterAdapterSummary, RunNativeImporterAdapterOptions, NativeImporterAdapterImportResult } from './import-adapter-core.js';
import type { JavaScriptNativeImporterAdapterOptions, TypeScriptCompilerNativeImporterAdapterOptions, PythonAstNativeImporterAdapterOptions, RustSynNativeImporterAdapterOptions, ClangAstNativeImporterAdapterOptions, GoAstNativeImporterAdapterOptions } from './import-adapter-options-native.js';
import type { JavaAstNativeImporterAdapterOptions, KotlinPsiNativeImporterAdapterOptions, CSharpRoslynNativeImporterAdapterOptions, SwiftSyntaxNativeImporterAdapterOptions, TreeSitterNativeImporterAdapterOptions } from './import-adapter-options-platform.js';
import type { NativeTargetProjectionAdapterCoverageInput, NativeTargetProjectionAdapterSummary, NativeTargetProjectionAdapterInput, NativeTargetProjectionAdapterResult, NativeTargetProjectionAdapter, NativeTargetProjectionAdapterResolverInput, NativeTargetProjectionResult } from './target-adapters.js';
import type { NativeProjectSourceInput, ImportNativeProjectOptions, NativeProjectImportResult, NativeSourceProjectionMode, ProjectNativeImportToSourceOptions, NativeSourceProjectionDeclaration, NativeSourceProjectionResult, NativeSourceCompileOutputMode, CompileNativeSourceOptions, NativeSourceCompileResult } from './native-project.js';
import type { NativeImportRoundtripReadinessStatus, NativeImportRoundtripReadinessOptions, NativeImportRoundtripReadinessClassification } from './roundtrip.js';

export interface NativeImportContractSource {
  readonly id: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly parser?: string;
  readonly nativeSourceId?: string;
  readonly nativeAstId?: string;
  readonly semanticIndexId?: string;
  readonly universalAstId?: string;
  readonly patchId?: string;
  readonly sourceMapIds: readonly string[];
  readonly sourceMapMappings: number;
  readonly symbolCount: number;
  readonly lossCount: number;
  readonly evidenceCount: number;
  readonly readiness?: SemanticMergeReadiness;
}

export interface NativeImportSourcePreservationRecordSummary {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceBytes?: number;
  readonly lineCount?: number;
  readonly newline?: string;
  readonly encoding?: string;
  readonly exactSourceAvailable: boolean;
  readonly tokens: number;
  readonly trivia: number;
  readonly directives: number;
  readonly comments: number;
  readonly whitespace: number;
  readonly truncated: boolean;
}

export interface NativeImportSourcePreservationContract {
  readonly total: number;
  readonly ids: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly sourceHashes: readonly string[];
  readonly exactSourceAvailable: number;
  readonly sourceBytes: number;
  readonly lineCount: number;
  readonly tokens: number;
  readonly trivia: number;
  readonly directives: number;
  readonly comments: number;
  readonly whitespace: number;
  readonly truncated: boolean;
  readonly records: readonly NativeImportSourcePreservationRecordSummary[];
}

export interface NativeImportAdapterCoverageRecordSummary {
  readonly adapterId?: string;
  readonly adapterVersion?: string;
  readonly parser?: string;
  readonly capabilities: readonly string[];
  readonly supportedExtensions: readonly string[];
  readonly exactness?: NativeImporterAdapterExactness;
  readonly exactAst: boolean;
  readonly tokens: boolean;
  readonly trivia: boolean;
  readonly diagnostics: boolean;
  readonly sourceRanges: boolean;
  readonly generatedRanges: boolean;
  readonly semanticCoverage?: NativeImporterAdapterSemanticCoverage;
  readonly observed?: NativeImporterAdapterCoverageObserved;
  readonly notes: readonly string[];
}

export interface NativeImportAdapterCoverageContract {
  readonly total: number;
  readonly adapterIds: readonly string[];
  readonly parsers: readonly string[];
  readonly exactness: readonly string[];
  readonly exactAst: number;
  readonly tokens: number;
  readonly trivia: number;
  readonly diagnostics: number;
  readonly sourceRanges: number;
  readonly generatedRanges: number;
  readonly semanticCoverageLevels: readonly string[];
  readonly observed: NativeImporterAdapterCoverageObserved;
  readonly records: readonly NativeImportAdapterCoverageRecordSummary[];
}

export interface NativeImportRegionSummary {
  readonly total: number;
  readonly ids: readonly string[];
  readonly keys: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly byKind: Readonly<Record<string, number>>;
  readonly byGranularity: Readonly<Record<string, number>>;
  readonly byPrecision: Readonly<Record<string, number>>;
  readonly byLanguage: Readonly<Record<string, number>>;
  readonly symbolIds: readonly string[];
  readonly taxonomy: SemanticImportRegionTaxonomySummary;
}

export interface NativeImportSourceMapSummary {
  readonly total: number;
  readonly ids: readonly string[];
  readonly mappingCount: number;
  readonly sourcePaths: readonly string[];
  readonly targetPaths: readonly string[];
  readonly byPrecision: Readonly<Record<string, number>>;
  readonly sourceRangeMappings: number;
  readonly generatedRangeMappings: number;
}

export interface NativeImportReadinessContract {
  readonly semanticMergeReadiness: SemanticMergeReadiness;
  readonly severityReadiness: SemanticMergeReadiness;
  readonly reasons: readonly string[];
  readonly failedEvidenceIds: readonly string[];
  readonly blockingLossIds: readonly string[];
  readonly reviewLossIds: readonly string[];
  readonly informationalLossIds: readonly string[];
}

export interface NativeImportResultContract {
  readonly kind: 'frontier.lang.nativeImportResultContract';
  readonly version: 1;
  readonly importResultId?: string;
  readonly language?: FrontierSourceLanguage | 'mixed' | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceCount: number;
  readonly sources: readonly NativeImportContractSource[];
  readonly ids: {
    readonly nativeSourceId?: string;
    readonly nativeAstId?: string;
    readonly semanticIndexId?: string;
    readonly universalAstId?: string;
    readonly patchId?: string;
    readonly sourceMapIds: readonly string[];
    readonly semanticSidecarIds: readonly string[];
  };
  readonly sourcePreservation: NativeImportSourcePreservationContract;
  readonly adapterCoverage: NativeImportAdapterCoverageContract;
  readonly lossSummary: NativeImportLossSummary;
  readonly regions: NativeImportRegionSummary;
  readonly sourceMaps: NativeImportSourceMapSummary;
  readonly readiness: NativeImportReadinessContract;
  readonly evidence: {
    readonly total: number;
    readonly failed: readonly string[];
    readonly ids: readonly string[];
  };
  readonly metadata: Record<string, unknown>;
}

export interface NativeImportResultContractOptions extends SemanticImportSidecarOptions {
  readonly lossSummary?: NativeImportLossSummary;
  readonly semanticSidecarIds?: readonly string[] | string;
  readonly sidecarIds?: readonly string[] | string;
  readonly sidecarId?: string;
}
