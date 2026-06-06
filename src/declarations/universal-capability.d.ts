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
import type { ProjectionReadinessMatrix } from './projection-readiness.js';
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

export interface UniversalCapabilityLanguageRow {
  readonly language: FrontierSourceLanguage | string;
  readonly aliases: readonly string[];
  readonly extensions: readonly string[];
  readonly readiness: SemanticMergeReadiness;
  readonly imports: {
    readonly total: number;
    readonly readiness: SemanticMergeReadiness;
    readonly symbols: number;
    readonly sourceMaps: number;
    readonly sourceMapMappings: number;
    readonly losses: number;
    readonly lossKinds: Readonly<Record<string, number>>;
    readonly readinessReasons: readonly string[];
  };
  readonly parser: {
    readonly readiness: SemanticMergeReadiness;
    readonly rows: number;
    readonly parsers: readonly string[];
    readonly mergeReadyParsers: readonly string[];
    readonly blockingFeatures: readonly NativeParserFeatureCategory[];
    readonly reviewFeatures: readonly NativeParserFeatureCategory[];
    readonly languageSummary?: NativeParserFeatureLanguageSummary;
  };
  readonly projection: {
    readonly readiness: SemanticMergeReadiness;
    readonly sourceProjection?: ProjectionTargetLanguageCoverage['sourceProjection'];
    readonly targets: readonly ProjectionTargetCoverageEntry[];
    readonly summary: ProjectionTargetLanguageCoverage['summary'];
    readonly missingTargets: readonly (FrontierCompileTarget | string)[];
    readonly unsupportedTargets: readonly (FrontierCompileTarget | string)[];
  };
  readonly evidence: {
    readonly parserAdapters: number;
    readonly adapterCoverageSummaries: number;
    readonly adapterCoverageGaps: Readonly<Record<string, number>>;
    readonly knownLossKinds: readonly NativeImportKnownLossKind[];
    readonly sourceMapMappings: number;
  };
  readonly blockers: readonly string[];
  readonly review: readonly string[];
}

export interface UniversalCapabilityMatrix {
  readonly kind: 'frontier.lang.universalCapabilityMatrix';
  readonly version: 1;
  readonly generatedAt: number;
  readonly languages: readonly UniversalCapabilityLanguageRow[];
  readonly summary: {
    readonly languages: number;
    readonly imports: number;
    readonly symbols: number;
    readonly sourceMapMappings: number;
    readonly losses: number;
    readonly parserRows: number;
    readonly parserMergeReady: number;
    readonly targetEntries: number;
    readonly missingAdapters: number;
    readonly unsupportedTargetFeatures: number;
    readonly exactSourceProjection: number;
    readonly nativeSourceStubs: number;
    readonly blockers: number;
    readonly reviewReasons: number;
    readonly readyLanguages: number;
    readonly readyWithLossesLanguages: number;
    readonly reviewLanguages: number;
    readonly blockedLanguages: number;
    readonly byReadiness: Readonly<Record<SemanticMergeReadiness, number>>;
    readonly byImportReadiness: Readonly<Record<SemanticMergeReadiness, number>>;
    readonly byParserReadiness: Readonly<Record<SemanticMergeReadiness, number>>;
    readonly byProjectionReadiness: Readonly<Record<SemanticMergeReadiness, number>>;
  };
  readonly matrices: {
    readonly importCoverage: NativeImportCoverageMatrix;
    readonly parserFormats: NativeParserAstFormatMatrix;
    readonly parserFeatures: NativeParserFeatureMatrix;
    readonly projectionTargets: ProjectionTargetLossMatrix;
    readonly projectionReadiness: ProjectionReadinessMatrix;
  };
  readonly metadata: {
    readonly requiredFeatures: readonly NativeParserFeatureCategory[];
    readonly minimumReadiness: SemanticMergeReadiness;
    readonly compileTargets: readonly (FrontierCompileTarget | string)[];
    readonly note: string;
  };
}

export interface UniversalCapabilityMatrixOptions extends
  NativeImportCoverageMatrixOptions,
  NativeParserAstFormatMatrixOptions,
  NativeParserFeatureMatrixOptions,
  ProjectionTargetLossMatrixOptions {
  readonly targetAdapters?: readonly NativeTargetProjectionAdapter[];
  readonly targets?: readonly (FrontierCompileTarget | string)[];
  readonly projectionFeatureCategories?: readonly (NativeParserFeatureCategory | string)[];
}
