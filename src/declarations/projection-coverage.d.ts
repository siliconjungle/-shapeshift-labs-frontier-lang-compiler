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
import type { UniversalCapabilityLanguageRow, UniversalCapabilityMatrix, UniversalCapabilityMatrixOptions } from './universal-capability.js';
import type { NativeImportContractSource, NativeImportSourcePreservationRecordSummary, NativeImportSourcePreservationContract, NativeImportAdapterCoverageRecordSummary, NativeImportAdapterCoverageContract, NativeImportRegionSummary, NativeImportSourceMapSummary, NativeImportReadinessContract, NativeImportResultContract, NativeImportResultContractOptions } from './native-import-contracts.js';
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

export type ProjectionTargetLossClass =
  | 'exactSourceProjection'
  | 'nativeSourceStubs'
  | 'unsupportedTargetFeatures'
  | 'targetAdapterProjection'
  | 'missingAdapter'
  | string;

export interface ProjectionSourceProjectionCoverage {
  readonly lossClass: ProjectionTargetLossClass;
  readonly mode: NativeSourceProjectionMode;
  readonly supported: boolean;
  readonly readiness: SemanticMergeReadiness;
  readonly lossKinds: readonly NativeImportKnownLossKind[];
  readonly categories: readonly NativeImportTaxonomyKind[];
  readonly reason: string;
  readonly evidence: {
    readonly imports: number;
    readonly importsWithExactSource?: number;
    readonly importsWithDeclarations?: number;
  };
  readonly notes: readonly string[];
}

export interface ProjectionTargetCoverageEntry {
  readonly target: FrontierCompileTarget | string;
  readonly lossClass: ProjectionTargetLossClass;
  readonly supported: boolean;
  readonly readiness: SemanticMergeReadiness;
  readonly lossKinds: readonly NativeImportKnownLossKind[];
  readonly categories: readonly NativeImportTaxonomyKind[];
  readonly reason: string;
  readonly adapter?: string;
  readonly adapterKind?: 'importer' | 'targetProjection' | string;
  readonly adapterVersion?: string;
  readonly adapterCoverage?: NativeTargetProjectionAdapterCoverageInput;
  readonly notes: readonly string[];
}

export interface ProjectionTargetLanguageCoverage {
  readonly language: FrontierSourceLanguage | string;
  readonly aliases: readonly string[];
  readonly extensions: readonly string[];
  readonly supportsLightweightScan: boolean;
  readonly parserAdapters: readonly string[];
  readonly projectionTargets: readonly (FrontierCompileTarget | string)[];
  readonly knownLossKinds: readonly NativeImportKnownLossKind[];
  readonly defaultReadiness: SemanticMergeReadiness;
  readonly notes: readonly string[];
  readonly sourceProjection: {
    readonly exactSource: ProjectionSourceProjectionCoverage;
    readonly stubs: ProjectionSourceProjectionCoverage;
  };
  readonly targets: readonly ProjectionTargetCoverageEntry[];
  readonly summary: {
    readonly imports: number;
    readonly parserAdapters: number;
    readonly targetEntries: number;
    readonly byLossClass: Readonly<Record<ProjectionTargetLossClass, number>>;
    readonly exactSourceImports: number;
    readonly stubDeclarationImports: number;
  };
}

export interface ProjectionTargetLossMatrix {
  readonly kind: 'frontier.lang.projectionTargetLossMatrix';
  readonly version: 1;
  readonly generatedAt: number;
  readonly languages: readonly ProjectionTargetLanguageCoverage[];
  readonly summary: {
    readonly languages: number;
    readonly targetEntries: number;
    readonly byLossClass: Readonly<Record<ProjectionTargetLossClass, number>>;
    readonly sourceProjectionByLossClass: Readonly<Record<ProjectionTargetLossClass, number>>;
    readonly exactSourceProjection: number;
    readonly nativeSourceStubs: number;
    readonly targetAdapterProjection: number;
    readonly unsupportedTargetFeatures: number;
    readonly missingAdapters: number;
  };
  readonly metadata: {
    readonly compileTargets: readonly (FrontierCompileTarget | string)[];
    readonly lossClasses: readonly ProjectionTargetLossClass[];
    readonly note: string;
  };
}

export interface ProjectionTargetLossMatrixOptions {
  readonly languages?: readonly NativeImportLanguageProfile[];
  readonly imports?: readonly NativeSourceImportResult[];
  readonly adapters?: readonly NativeImporterAdapter[];
  readonly targetAdapters?: readonly NativeTargetProjectionAdapter[];
  readonly targets?: readonly (FrontierCompileTarget | string)[];
  readonly generatedAt?: number;
}
