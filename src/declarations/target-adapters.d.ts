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
import type { NativeImportContractSource, NativeImportSourcePreservationRecordSummary, NativeImportSourcePreservationContract, NativeImportAdapterCoverageRecordSummary, NativeImportAdapterCoverageContract, NativeImportRegionSummary, NativeImportSourceMapSummary, NativeImportReadinessContract, NativeImportResultContract, NativeImportResultContractOptions } from './native-import-contracts.js';
import type { NativeSourceTokenKind, NativeSourcePreservedToken, NativeSourcePreservedDirective, NativeSourcePreservation, CreateNativeSourcePreservationOptions } from './source-preservation.js';
import type { SemanticImportOwnershipRegion, SemanticImportSidecarSymbol, SemanticImportRegionTaxonomySummary, SemanticImportPatchHint, SemanticImportSidecarImportEntry, SemanticImportSidecarSourcePreservationRecord, SemanticImportSidecarUniversalAstLayerSummary, SemanticImportSidecarProofSpecSummary, SemanticImportSidecarParadigmSemanticsSummary, SemanticImportSidecar, SemanticImportSidecarOptions } from './semantic-sidecar.js';
import type { NativeSourceChangeKind, NativeSourceChangeProjectionEndpoint, NativeSourceChangeProjectionSourceMapLink, NativeSourceChangeProjectionMetadata, NativeSourceChangeProjectionSummary, NativeSourceChangeSymbol, NativeSourceChangeRegion, NativeSourceChangeSummary, DiffNativeSourceImportsOptions, DiffNativeSourcesOptions, NativeSourceChangeSet } from './native-diff.js';
import type { SemanticSliceInput, CreateSemanticSliceOptions, SemanticSliceSourceMapLink, SemanticSliceSourceFile, SemanticSliceExpectedAssertion, SemanticSlice, TestSemanticSliceOptions, SemanticSliceTestAssertion, SemanticSliceTestResult } from './semantic-slice.js';
import type { NativeImporterAdapterExactness, NativeImporterAdapterSemanticCoverage, NativeImporterAdapterCoverageSnapshot, NativeImporterAdapterCoverageObserved, NativeImporterAdapterCoverageCapabilityRow, NativeImporterAdapterCoverageCapabilityEvidence, NativeImporterAdapterCoverageSummary, NativeImporterAdapterCoverageInput } from './adapter-coverage.js';
import type { NativeImporterAdapterDiagnostic, ImportNativeSourceOptions, NativeSourceImportResult, ExternalSemanticIndexFormat, ImportExternalSemanticIndexOptions, ExternalSemanticIndexImportSummary, ExternalSemanticIndexImportResult, NativeImporterAdapterParseInput, NativeImporterAdapterParseResult, NativeImporterAdapter, NativeImporterAdapterSummary, RunNativeImporterAdapterOptions, NativeImporterAdapterImportResult } from './import-adapter-core.js';
import type { JavaScriptNativeImporterAdapterOptions, TypeScriptCompilerNativeImporterAdapterOptions, PythonAstNativeImporterAdapterOptions, RustSynNativeImporterAdapterOptions, ClangAstNativeImporterAdapterOptions, GoAstNativeImporterAdapterOptions } from './import-adapter-options-native.js';
import type { JavaAstNativeImporterAdapterOptions, KotlinPsiNativeImporterAdapterOptions, CSharpRoslynNativeImporterAdapterOptions, SwiftSyntaxNativeImporterAdapterOptions, TreeSitterNativeImporterAdapterOptions } from './import-adapter-options-platform.js';
import type { NativeProjectSourceInput, ImportNativeProjectOptions, NativeProjectImportResult, NativeSourceProjectionMode, ProjectNativeImportToSourceOptions, NativeSourceProjectionDeclaration, NativeSourceProjectionResult, NativeSourceCompileOutputMode, CompileNativeSourceOptions, NativeSourceCompileResult } from './native-project.js';
import type { NativeImportRoundtripReadinessStatus, NativeImportRoundtripReadinessOptions, NativeImportRoundtripReadinessClassification } from './roundtrip.js';

export interface NativeTargetProjectionAdapterCoverageInput {
  readonly readiness?: SemanticMergeReadiness;
  readonly lossKinds?: readonly NativeImportKnownLossKind[];
  readonly handledLossKinds?: readonly NativeImportKnownLossKind[];
  readonly sourceMapPrecision?: SourceMapMappingRecord['precision'] | 'none' | string;
  readonly semanticCoverage?: Partial<NativeImporterAdapterSemanticCoverage>;
  readonly notes?: readonly string[];
}

export interface NativeTargetProjectionAdapterSummary {
  readonly id: string;
  readonly sourceLanguage: FrontierSourceLanguage | string;
  readonly target: FrontierCompileTarget | string;
  readonly version?: string;
  readonly capabilities: readonly string[];
  readonly supportedParsers: readonly string[];
  readonly supportedExtensions: readonly string[];
  readonly coverage: Required<Pick<NativeTargetProjectionAdapterCoverageInput, 'readiness' | 'lossKinds' | 'handledLossKinds' | 'notes'>> & NativeTargetProjectionAdapterCoverageInput;
  readonly diagnostics: readonly NativeImporterAdapterDiagnostic[];
}

export interface NativeTargetProjectionAdapterInput {
  readonly importResult: NativeSourceImportResult;
  readonly sourceProjection: NativeSourceProjectionResult;
  readonly sourceLanguage: FrontierSourceLanguage | string;
  readonly target: FrontierCompileTarget | string;
  readonly targetPath?: string;
  readonly targetCoverage?: ProjectionTargetCoverageEntry;
  readonly options: Record<string, unknown>;
  readonly metadata: Record<string, unknown>;
}

export interface Ecma426SourceMapSection {
  readonly offset: { readonly line: number; readonly column: number };
  readonly map: Ecma426SourceMapPayload;
}

export interface Ecma426SourceMapPayload {
  readonly version: 3;
  readonly file?: string;
  readonly sourceRoot?: string;
  readonly sources?: readonly (string | null)[];
  readonly sourcesContent?: readonly (string | null)[];
  readonly names?: readonly string[];
  readonly mappings?: string;
  readonly ignoreList?: readonly number[];
  readonly sections?: readonly Ecma426SourceMapSection[];
  readonly [key: string]: unknown;
}

export type NativeSourceMapInput = SourceMapRecord | Ecma426SourceMapPayload | string;

export interface NativeTargetProjectionAdapterResult {
  readonly id?: string;
  readonly output?: string;
  readonly outputHash?: string;
  readonly sourceMaps?: readonly NativeSourceMapInput[];
  readonly losses?: readonly NativeAstLossRecord[];
  readonly evidence?: readonly EvidenceRecord[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly readiness?: SemanticMergeReadiness;
  readonly metadata?: Record<string, unknown>;
}

export interface NativeTargetProjectionAdapter {
  readonly id: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly language?: FrontierSourceLanguage | string;
  readonly target: FrontierCompileTarget | string;
  readonly targetLanguage?: FrontierCompileTarget | string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly supportedParsers?: readonly string[];
  readonly supportedExtensions?: readonly string[];
  readonly coverage?: NativeTargetProjectionAdapterCoverageInput;
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly project: (input: NativeTargetProjectionAdapterInput) => NativeTargetProjectionAdapterResult;
}

export interface NativeTargetProjectionAdapterResolverInput {
  readonly importResult: NativeSourceImportResult;
  readonly sourceProjection: NativeSourceProjectionResult;
  readonly sourceLanguage: FrontierSourceLanguage | string;
  readonly target: FrontierCompileTarget | string;
  readonly sourcePath?: string;
  readonly parser?: string;
}

export interface NativeTargetProjectionResult {
  readonly kind: 'frontier.lang.nativeTargetProjection';
  readonly version: 1;
  readonly id: string;
  readonly sourceLanguage: FrontierSourceLanguage | string;
  readonly target: FrontierCompileTarget | string;
  readonly targetPath?: string;
  readonly adapter: NativeTargetProjectionAdapterSummary;
  readonly output: string;
  readonly outputHash: string;
  readonly outputMode: 'target-adapter';
  readonly sourceMaps: readonly NativeSourceMapInput[];
  readonly losses: readonly NativeAstLossRecord[];
  readonly lossSummary: NativeImportLossSummary;
  readonly readiness: NativeImportReadinessClassification;
  readonly evidence: readonly EvidenceRecord[];
  readonly diagnostics: readonly NativeImporterAdapterDiagnostic[];
  readonly metadata: Record<string, unknown>;
}
