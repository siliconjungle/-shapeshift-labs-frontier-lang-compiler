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
import type { NativeTargetProjectionAdapterCoverageInput, NativeTargetProjectionAdapterSummary, NativeTargetProjectionAdapterInput, NativeTargetProjectionAdapterResult, NativeTargetProjectionAdapter, NativeTargetProjectionAdapterResolverInput, NativeTargetProjectionResult } from './target-adapters.js';
import type { NativeProjectSourceInput, ImportNativeProjectOptions, NativeProjectImportResult, NativeSourceProjectionMode, ProjectNativeImportToSourceOptions, NativeSourceProjectionDeclaration, NativeSourceProjectionResult, NativeSourceCompileOutputMode, CompileNativeSourceOptions, NativeSourceCompileResult } from './native-project.js';
import type { NativeImportRoundtripReadinessStatus, NativeImportRoundtripReadinessOptions, NativeImportRoundtripReadinessClassification } from './roundtrip.js';

export type FrontierCompileTarget = 'typescript' | 'javascript' | 'rust' | 'python' | 'c';

export type FrontierCompileEmitOptions =
  | EmitTypeScriptOptions
  | EmitJavaScriptOptions
  | EmitRustOptions
  | EmitPythonOptions
  | EmitCHeaderOptions;

export type FrontierTargetAst =
  | TypeScriptAstModule
  | JavaScriptAstModule
  | RustAstModule
  | PythonAstModule
  | CAstHeader;

export type FrontierTargetSourceMapResult =
  | TypeScriptGeneratedSourceMapResult
  | JavaScriptSourceMapResult
  | RustSourceMapResult
  | PythonSourceMapResult
  | CSourceMapResult;

export type FrontierTargetDocumentSourceMapResult =
  | TypeScriptDocumentSourceMapResult
  | EmitJavaScriptWithSourceMapResult
  | EmitRustWithSourceMapResult
  | EmitPythonWithSourceMapResult
  | EmitCHeaderWithSourceMapResult;

export interface FrontierCompileSourceMapOptions {
  readonly sourceMapId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly target?: CompileTarget;
  readonly targetPath?: string;
  readonly targetHash?: string;
  readonly semanticIndexId?: string;
  readonly universalAstId?: string;
  readonly nativeAstId?: string;
  readonly nativeSourceId?: string;
  readonly semanticSymbolIdsBySemanticNodeId?: Readonly<Record<string, string>>;
  readonly semanticOccurrenceIdsBySemanticNodeId?: Readonly<Record<string, string>>;
  readonly sourceSpansBySemanticNodeId?: Readonly<Record<string, SourceSpan>>;
  readonly lossIdsBySemanticNodeId?: Readonly<Record<string, readonly string[]>>;
  readonly evidence?: readonly EvidenceRecord[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface FrontierCompileOptions {
  readonly target?: FrontierCompileTarget | 'ts' | 'js' | 'rs' | 'py' | 'h';
  readonly fileName?: string;
  readonly sourcePath?: string;
  readonly parse?: Record<string, unknown>;
  readonly check?: Record<string, unknown>;
  readonly emit?: FrontierCompileEmitOptions;
  readonly sourceMap?: boolean | FrontierCompileSourceMapOptions;
  readonly emitOnError?: boolean;
}

export interface FrontierDeclaredTargetCompileOptions extends FrontierCompileOptions {
  readonly targetNodeIds?: readonly string[] | string;
  readonly targetNames?: readonly string[] | string;
  readonly targetLanguages?: readonly (FrontierCompileTarget | 'ts' | 'js' | 'rs' | 'py' | 'h' | string)[] | FrontierCompileTarget | 'ts' | 'js' | 'rs' | 'py' | 'h' | string;
}

export interface FrontierCompileResult {
  readonly ok: boolean;
  readonly target: FrontierCompileTarget;
  readonly hash: string;
  readonly document: FrontierLangDocument;
  readonly diagnostics: readonly Diagnostic[];
  readonly sourcePath?: string;
  readonly ast?: FrontierTargetAst;
  readonly output: string;
  readonly sourceMap?: SourceMapRecord;
}

export interface FrontierDeclaredTargetProjectionContract {
  readonly kind: 'frontier.lang.declaredTargetProjectionContract';
  readonly version: 1;
  readonly id: string;
  readonly targetNodeId: string;
  readonly targetName: string;
  readonly target?: FrontierCompileTarget;
  readonly declaredTarget?: string;
  readonly targetPath?: string;
  readonly sourceMapId?: string;
  readonly disposition?: string;
  readonly readiness?: SemanticMergeReadiness | string;
  readonly adapterId?: string;
  readonly contracts: readonly Readonly<Record<string, unknown>>[];
  readonly layers: readonly Readonly<Record<string, unknown>>[];
  readonly representedLayerKinds: readonly string[];
  readonly missingLayerKinds: readonly string[];
  readonly requiredLayerKinds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly proofEvidenceIds: readonly string[];
  readonly lossIds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly review: readonly string[];
  readonly blockers: readonly string[];
  readonly semanticEquivalenceClaim: false;
  readonly autoMergeClaim: false;
}

export interface FrontierDeclaredTargetArtifact {
  readonly kind: 'frontier.lang.declaredTargetArtifact';
  readonly version: 1;
  readonly targetNodeId: string;
  readonly targetName: string;
  readonly target?: FrontierCompileTarget;
  readonly declaredTarget?: string;
  readonly packageName?: string;
  readonly moduleFormat?: string;
  readonly targetPath?: string;
  readonly ok: boolean;
  readonly hash: string;
  readonly diagnostics: readonly Diagnostic[];
  readonly ast?: FrontierTargetAst;
  readonly output: string;
  readonly sourceMap?: SourceMapRecord;
  readonly projectionContract?: FrontierDeclaredTargetProjectionContract;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly error?: string;
}

export interface FrontierDeclaredTargetCompilationResult {
  readonly kind: 'frontier.lang.declaredTargetCompilation';
  readonly version: 1;
  readonly ok: boolean;
  readonly hash: string;
  readonly document: FrontierLangDocument;
  readonly diagnostics: readonly Diagnostic[];
  readonly sourcePath?: string;
  readonly artifacts: readonly FrontierDeclaredTargetArtifact[];
  readonly summary: {
    readonly targets: number;
    readonly emitted: number;
    readonly failed: number;
  };
}

export interface CapabilityResolution {
  readonly nodeId: string;
  readonly name: string;
  readonly capability: string;
  readonly target: CompileTarget;
  readonly status: 'bound' | 'unsupported' | 'unbound';
  readonly adapters: readonly CapabilityAdapterBinding[];
  readonly unsupported?: CapabilityUnsupportedTarget;
  readonly reason?: string;
}
