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
import type { UniversalDialectRegistry, UniversalDialectRegistryInput, UniversalDialectRecordInput, UniversalExternRecordInput } from './universal-dialects.js';
import type { NativeImportContractSource, NativeImportSourcePreservationRecordSummary, NativeImportSourcePreservationContract, NativeImportAdapterCoverageRecordSummary, NativeImportAdapterCoverageContract, NativeImportRegionSummary, NativeImportSourceMapSummary, NativeImportReadinessContract, NativeImportResultContract, NativeImportResultContractOptions } from './native-import-contracts.js';
import type { NativeSourceTokenKind, NativeSourcePreservedToken, NativeSourcePreservedDirective, NativeSourcePreservation, CreateNativeSourcePreservationOptions, ParserTriviaEvidenceInput } from './source-preservation.js';
import type { SemanticImportOwnershipRegion, SemanticImportSidecarSymbol, SemanticImportRegionTaxonomySummary, SemanticImportPatchHint, SemanticImportSidecarImportEntry, SemanticImportSidecarSourcePreservationRecord, SemanticImportSidecarUniversalAstLayerSummary, SemanticImportSidecarProofSpecSummary, SemanticImportSidecarParadigmSemanticsSummary, SemanticImportSidecar, SemanticImportSidecarOptions } from './semantic-sidecar.js';
import type { NativeSourceChangeKind, NativeSourceChangeProjectionEndpoint, NativeSourceChangeProjectionSourceMapLink, NativeSourceChangeProjectionMetadata, NativeSourceChangeProjectionSummary, NativeSourceChangeSymbol, NativeSourceChangeRegion, NativeSourceChangeSummary, DiffNativeSourceImportsOptions, DiffNativeSourcesOptions, NativeSourceChangeSet } from './native-diff.js';
import type { SemanticSliceInput, CreateSemanticSliceOptions, SemanticSliceSourceMapLink, SemanticSliceSourceFile, SemanticSliceExpectedAssertion, SemanticSlice, TestSemanticSliceOptions, SemanticSliceTestAssertion, SemanticSliceTestResult } from './semantic-slice.js';
import type { NativeImporterAdapterExactness, NativeImporterAdapterSemanticCoverage, NativeImporterAdapterCoverageSnapshot, NativeImporterAdapterCoverageObserved, NativeImporterAdapterCoverageCapabilityRow, NativeImporterAdapterCoverageCapabilityEvidence, NativeImporterAdapterCoverageSummary, NativeImporterAdapterCoverageInput } from './adapter-coverage.js';
import type { JavaScriptNativeImporterAdapterOptions, TypeScriptCompilerNativeImporterAdapterOptions, PythonAstNativeImporterAdapterOptions, RustSynNativeImporterAdapterOptions, ClangAstNativeImporterAdapterOptions, GoAstNativeImporterAdapterOptions } from './import-adapter-options-native.js';
import type { JavaAstNativeImporterAdapterOptions, KotlinPsiNativeImporterAdapterOptions, CSharpRoslynNativeImporterAdapterOptions, SwiftSyntaxNativeImporterAdapterOptions, TreeSitterNativeImporterAdapterOptions } from './import-adapter-options-platform.js';
import type { NativeSourceMapInput, NativeTargetProjectionAdapterCoverageInput, NativeTargetProjectionAdapterSummary, NativeTargetProjectionAdapterInput, NativeTargetProjectionAdapterResult, NativeTargetProjectionAdapter, NativeTargetProjectionAdapterResolverInput, NativeTargetProjectionResult } from './target-adapters.js';
import type { NativeProjectSourceInput, ImportNativeProjectOptions, NativeProjectImportResult, NativeSourceProjectionMode, ProjectNativeImportToSourceOptions, NativeSourceProjectionDeclaration, NativeSourceProjectionResult, NativeSourceCompileOutputMode, CompileNativeSourceOptions, NativeSourceCompileResult } from './native-project.js';
import type { NativeImportRoundtripReadinessStatus, NativeImportRoundtripReadinessOptions, NativeImportRoundtripReadinessClassification } from './roundtrip.js';

export interface NativeImporterAdapterDiagnostic {
  readonly id?: string;
  readonly severity?: 'info' | 'warning' | 'error';
  readonly code?: string;
  readonly phase?: 'read' | 'parse' | 'map' | 'index' | 'import' | string;
  readonly kind?: NativeAstLossRecord['kind'];
  readonly message: string;
  readonly path?: string;
  readonly span?: SourceSpan;
  readonly metadata?: Record<string, unknown>;
}

export interface ImportNativeSourceOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string;
  readonly parserVersion?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceText?: string;
  readonly parserTriviaEvidence?: ParserTriviaEvidenceInput;
  readonly symbol?: string;
  readonly name?: string;
  readonly nativeAst?: NativeAstRecord;
  readonly nativeAstId?: string;
  readonly nativeAstMetadata?: Record<string, unknown>;
  readonly nativeSourceId?: string;
  readonly nativeSourceMetadata?: Record<string, unknown>;
  readonly documentId?: string;
  readonly documentName?: string;
  readonly documentMetadata?: Record<string, unknown>;
  readonly rootId?: string;
  readonly rootIds?: readonly string[];
  readonly nodes?: Readonly<Record<string, NativeAstNode>>;
  readonly semanticNodes?: readonly SemanticNode[];
  readonly frontierNodeIds?: readonly string[];
  readonly mappings?: readonly SourceMapMappingRecord[];
  readonly semanticStatus?: 'native-only' | 'mapped' | 'partial' | string;
  readonly losses?: readonly NativeAstLossRecord[];
  readonly evidence?: readonly EvidenceRecord[];
  readonly evidenceId?: string;
  readonly sourcePreservation?: NativeSourcePreservation;
  readonly patch?: SemanticPatchBundle;
  readonly patchId?: string;
  readonly author?: string;
  readonly target?: CompileTarget;
  readonly targetPath?: string;
  readonly targetHash?: string;
  readonly semanticIndex?: SemanticIndexRecord;
  readonly ownershipRegions?: readonly SemanticImportOwnershipRegion[];
  readonly semanticOwnershipRegions?: readonly SemanticImportOwnershipRegion[];
  readonly patchHints?: readonly SemanticImportPatchHint[];
  readonly semanticPatchHints?: readonly SemanticImportPatchHint[];
  readonly sourceMapId?: string;
  readonly sourceMaps?: readonly NativeSourceMapInput[];
  readonly universalAstId?: string;
  readonly universalAstMetadata?: Record<string, unknown>;
  readonly universalDialectRegistry?: UniversalDialectRegistryInput | UniversalDialectRegistry;
  readonly dialects?: readonly UniversalDialectRecordInput[];
  readonly externs?: readonly UniversalExternRecordInput[];
  readonly exactAst?: boolean;
  readonly metadata?: Record<string, unknown>;
}

export type NativeSourceImportResult = Omit<LanguageImportResult, 'metadata'> & {
  readonly nativeSource: NativeSourceNode;
  readonly semanticIndex?: SemanticIndexRecord;
  readonly ownershipRegions: readonly SemanticImportOwnershipRegion[];
  readonly patchHints: readonly SemanticImportPatchHint[];
  readonly universalAst: FrontierUniversalAstEnvelope;
  readonly metadata?: Record<string, unknown> & {
    readonly sourcePreservationRecords?: readonly SourcePreservationRecord[];
    readonly kernelSourcePreservationRecords?: readonly SourcePreservationRecord[];
  };
};

export type ExternalSemanticIndexFormat =
  | 'frontier-semantic-index'
  | 'scip'
  | 'lsif'
  | 'lsp'
  | 'semanticdb'
  | 'glean'
  | string;

export interface ImportExternalSemanticIndexOptions {
  readonly format?: ExternalSemanticIndexFormat;
  readonly payload?: unknown;
  readonly semanticIndex?: SemanticIndexRecord;
  readonly id?: string;
  readonly semanticIndexId?: string;
  readonly universalAstId?: string;
  readonly documentId?: string;
  readonly documentName?: string;
  readonly sourceMapId?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly projectRoot?: string;
  readonly parser?: string;
  readonly evidence?: readonly EvidenceRecord[];
  readonly metadata?: Record<string, unknown>;
  readonly universalAstMetadata?: Record<string, unknown>;
}

export interface ExternalSemanticIndexImportSummary {
  readonly documents: number;
  readonly symbols: number;
  readonly occurrences: number;
  readonly relations: number;
  readonly facts: number;
  readonly ownershipRegions: number;
  readonly ownershipRegionKinds: readonly string[];
  readonly sourceMapMappings: number;
  readonly losses: number;
  readonly readiness: SemanticMergeReadiness;
}

export interface ExternalSemanticIndexImportResult {
  readonly kind: 'frontier.lang.externalSemanticIndexImport';
  readonly version: 1;
  readonly id: string;
  readonly format: ExternalSemanticIndexFormat;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly projectRoot?: string;
  readonly semanticIndex: SemanticIndexRecord;
  readonly universalAst: FrontierUniversalAstEnvelope;
  readonly sourceMaps: readonly SourceMapRecord[];
  readonly ownershipRegions: readonly SemanticImportOwnershipRegion[];
  readonly losses: readonly NativeAstLossRecord[];
  readonly evidence: readonly EvidenceRecord[];
  readonly readiness: NativeImportReadinessClassification;
  readonly summary: ExternalSemanticIndexImportSummary;
  readonly metadata: Record<string, unknown>;
}

export interface NativeImporterAdapterParseInput {
  readonly sourceText: string;
  readonly sourcePath?: string;
  readonly sourceHash: string;
  readonly language: FrontierSourceLanguage;
  readonly parser: string;
  readonly parserVersion?: string;
  readonly adapterId: string;
  readonly adapterVersion?: string;
  readonly options: Record<string, unknown>;
  readonly metadata: Record<string, unknown>;
}

export interface NativeImporterAdapterParseResult extends Omit<ImportNativeSourceOptions, 'language' | 'parser' | 'parserVersion' | 'sourceText'> {
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
}

export interface NativeImporterAdapter {
  readonly id: string;
  readonly language: FrontierSourceLanguage;
  readonly parser: string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly coverage?: NativeImporterAdapterCoverageInput;
  readonly supportedExtensions?: readonly string[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly parse: (input: NativeImporterAdapterParseInput) => NativeImporterAdapterParseResult | Promise<NativeImporterAdapterParseResult>;
}


export interface NativeImporterAdapterSummary {
  readonly id: string;
  readonly language: FrontierSourceLanguage;
  readonly parser: string;
  readonly version?: string;
  readonly capabilities: readonly string[];
  readonly coverage: NativeImporterAdapterCoverageSummary;
  readonly supportedExtensions: readonly string[];
  readonly diagnostics: readonly NativeImporterAdapterDiagnostic[];
}

export interface RunNativeImporterAdapterOptions extends Omit<ImportNativeSourceOptions, 'language' | 'parser' | 'parserVersion' | 'sourceText'> {
  readonly sourceText: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string;
  readonly parserVersion?: string;
  readonly adapterOptions?: Record<string, unknown>;
  readonly adapterMetadata?: Record<string, unknown>;
}

export type NativeImporterAdapterImportResult = NativeSourceImportResult & {
  readonly adapter: NativeImporterAdapterSummary;
  readonly diagnostics: readonly NativeImporterAdapterDiagnostic[];
};
