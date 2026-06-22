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
import type { NativeProjectImportAdmission } from './native-project-admission.js';
import type { NativeImporterAdapterExactness, NativeImporterAdapterSemanticCoverage, NativeImporterAdapterCoverageSnapshot, NativeImporterAdapterCoverageObserved, NativeImporterAdapterCoverageCapabilityRow, NativeImporterAdapterCoverageCapabilityEvidence, NativeImporterAdapterCoverageSummary, NativeImporterAdapterCoverageInput } from './adapter-coverage.js';
import type { NativeImporterAdapterDiagnostic, ImportNativeSourceOptions, NativeSourceImportResult, ExternalSemanticIndexFormat, ImportExternalSemanticIndexOptions, ExternalSemanticIndexImportSummary, ExternalSemanticIndexImportResult, NativeImporterAdapterParseInput, NativeImporterAdapterParseResult, NativeImporterAdapter, NativeImporterAdapterSummary, RunNativeImporterAdapterOptions, NativeImporterAdapterImportResult } from './import-adapter-core.js';
import type { JavaScriptNativeImporterAdapterOptions, TypeScriptCompilerNativeImporterAdapterOptions, PythonAstNativeImporterAdapterOptions, RustSynNativeImporterAdapterOptions, ClangAstNativeImporterAdapterOptions, GoAstNativeImporterAdapterOptions } from './import-adapter-options-native.js';
import type { JavaAstNativeImporterAdapterOptions, KotlinPsiNativeImporterAdapterOptions, CSharpRoslynNativeImporterAdapterOptions, SwiftSyntaxNativeImporterAdapterOptions, TreeSitterNativeImporterAdapterOptions } from './import-adapter-options-platform.js';
import type { NativeTargetProjectionAdapterCoverageInput, NativeTargetProjectionAdapterSummary, NativeTargetProjectionAdapterInput, NativeTargetProjectionAdapterResult, NativeTargetProjectionAdapter, NativeTargetProjectionAdapterResolverInput, NativeTargetProjectionResult } from './target-adapters.js';
import type { NativeImportRoundtripReadinessStatus, NativeImportRoundtripReadinessOptions, NativeImportRoundtripReadinessClassification } from './roundtrip.js';

export interface NativeProjectSourceInput extends ImportNativeSourceOptions {
  readonly adapter?: NativeImporterAdapter | string;
  readonly adapterOptions?: Record<string, unknown>;
  readonly adapterMetadata?: Record<string, unknown>;
}

export interface ImportNativeProjectOptions {
  readonly id?: string;
  readonly name?: string;
  readonly language?: FrontierSourceLanguage | 'mixed';
  readonly projectRoot?: string;
  readonly documentId?: string;
  readonly documentName?: string;
  readonly documentMetadata?: Record<string, unknown>;
  readonly universalAstId?: string;
  readonly universalAstMetadata?: Record<string, unknown>;
  readonly semanticIndexId?: string;
  readonly patchId?: string;
  readonly author?: string;
  readonly metadata?: Record<string, unknown>;
  readonly adapterOptions?: Record<string, unknown>;
  readonly adapterMetadata?: Record<string, unknown>;
  readonly adapters?: readonly NativeImporterAdapter[];
  readonly adapterResolver?: (source: NativeProjectSourceInput, adapters: readonly NativeImporterAdapter[]) => NativeImporterAdapter | undefined;
  readonly sources: readonly NativeProjectSourceInput[];
}

export type NativeProjectSymbolGraphRemainingField =
  | 'moduleEdges[].resolutionKind'
  | 'moduleEdges[].packageName'
  | 'moduleEdges[].packageExportCondition'
  | 'reExportIdentities[].originSymbolId'
  | 'reExportIdentities[].exportedSymbolId'
  | 'reExportIdentities[].localSymbolId'
  | 'publicContractRegions[].apiSurfaceKind'
  | 'publicContractRegions[].signatureHash'
  | 'publicContractRegions[].contractHash'
  | string;

export interface NativeProjectSymbolGraphFileHashRecord {
  readonly id: string;
  readonly documentId: string;
  readonly sourcePath?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourceHash: string;
  readonly algorithm?: string;
  readonly value: string;
  readonly factId?: string;
}

export interface NativeProjectSymbolGraphModuleEdgeRecord {
  readonly id: string;
  readonly sourceDocumentId: string;
  readonly targetSymbolId: string;
  readonly predicate: 'imports' | 'exports' | string;
  readonly edgeKind?: 'import' | 'export' | 're-export' | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly moduleSpecifier?: string;
  readonly resolvedModulePath?: string;
  readonly targetDocumentId?: string;
  readonly resolvedTargetSymbolId?: string;
  readonly resolutionKind?: 'relative-source' | 'relative-missing' | string;
  readonly importKind?: string;
  readonly exportKind?: string;
  readonly importedName?: string;
  readonly exportedName?: string;
  readonly localName?: string;
  readonly namespace?: string;
  readonly isTypeOnly?: boolean;
  readonly isReExport?: boolean;
  readonly publicContract?: boolean;
  readonly evidenceIds?: readonly string[];
}

export interface NativeProjectSymbolGraphReExportIdentityRecord {
  readonly kind?: 'frontier.lang.reExportIdentity' | string;
  readonly version?: 1;
  readonly id: string;
  readonly sourceDocumentId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly moduleSpecifier?: string;
  readonly exportedName?: string;
  readonly importedName?: string;
  readonly localName?: string;
  readonly namespace?: string;
  readonly isTypeOnly?: boolean;
  readonly symbolId?: string;
  readonly relationId?: string;
  readonly ownershipRegionId?: string;
  readonly ownershipRegionKey?: string;
  readonly publicContract?: boolean;
  readonly factId?: string;
}

export interface NativeProjectSymbolGraphPublicContractRegionRecord {
  readonly id: string;
  readonly key?: string;
  readonly regionKind?: string;
  readonly granularity?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly documentId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly symbolKind?: string;
  readonly nativeAstNodeId?: string;
  readonly sourceSpan?: SourceSpan;
  readonly precision?: string;
  readonly publicContract?: boolean;
  readonly exportedName?: string;
  readonly moduleSpecifier?: string;
  readonly edgeKind?: string;
  readonly factId?: string;
}

export interface NativeProjectSymbolGraphSummary {
  readonly kind: 'frontier.lang.projectSymbolGraph';
  readonly version: 1;
  readonly projectRoot?: string;
  readonly sourceCount: number;
  readonly documentCount: number;
  readonly symbolCount: number;
  readonly occurrenceCount: number;
  readonly relationCount: number;
  readonly factCount: number;
  readonly fileHashes: readonly NativeProjectSymbolGraphFileHashRecord[];
  readonly importEdges: readonly NativeProjectSymbolGraphModuleEdgeRecord[];
  readonly exportEdges: readonly NativeProjectSymbolGraphModuleEdgeRecord[];
  readonly reExportIdentities: readonly NativeProjectSymbolGraphReExportIdentityRecord[];
  readonly publicContractRegions: readonly NativeProjectSymbolGraphPublicContractRegionRecord[];
  readonly remainingFields: readonly NativeProjectSymbolGraphRemainingField[];
}

export interface NativeProjectImportResultMetadata extends Record<string, unknown> {
  readonly importResultContract?: NativeImportResultContract;
  readonly projectAdmission?: NativeProjectImportAdmission;
  readonly semanticMergeAdmission?: NativeProjectImportAdmission;
  readonly nativeImportLossSummary?: NativeImportLossSummary;
  readonly semanticMergeReadiness?: SemanticMergeReadiness;
  readonly readinessReasons?: readonly string[];
  readonly projectSymbolGraph?: NativeProjectSymbolGraphSummary;
}

export interface NativeProjectImportResult {
  readonly kind: 'frontier.lang.projectImportResult';
  readonly version: 1;
  readonly id: string;
  readonly language: FrontierSourceLanguage | 'mixed';
  readonly projectRoot?: string;
  readonly imports: readonly NativeSourceImportResult[];
  readonly document: FrontierLangDocument;
  readonly patch: SemanticPatchBundle;
  readonly nativeSources: readonly NativeSourceNode[];
  readonly semanticIndex?: SemanticIndexRecord;
  readonly universalAst: FrontierUniversalAstEnvelope;
  readonly sourceMaps: readonly SourceMapRecord[];
  readonly losses: readonly NativeAstLossRecord[];
  readonly evidence: readonly EvidenceRecord[];
  readonly mergeCandidates: readonly SemanticMergeCandidateRecord[];
  readonly projectSymbolGraph?: NativeProjectSymbolGraphSummary;
  readonly metadata?: NativeProjectImportResultMetadata;
}

export type NativeSourceProjectionMode = 'preserved-source' | 'native-source-stubs';

export interface ProjectNativeImportToSourceOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly expectedSourceHash?: string;
  readonly sourceText?: string;
  readonly preservedSourceText?: string;
  readonly exactSourceText?: string;
  readonly sourceHash?: string;
  readonly verifySourceHash?: boolean;
  readonly preferPreservedSource?: boolean;
  readonly stubBanner?: string | false;
  readonly evidenceId?: string;
  readonly parser?: string;
  readonly semanticStatus?: string;
  readonly nativeSource?: NativeSourceNode;
  readonly nativeAst?: NativeAstRecord;
  readonly semanticIndex?: SemanticIndexRecord;
  readonly metadata?: Record<string, unknown>;
}

export interface NativeSourceProjectionDeclaration {
  readonly name: string;
  readonly kind: string;
  readonly symbolId?: string;
  readonly nativeAstNodeId?: string;
  readonly sourceSpan?: SourceSpan;
  readonly ownershipRegionId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface NativeSourceProjectionResult {
  readonly kind: 'frontier.lang.nativeSourceProjection';
  readonly version: 1;
  readonly id: string;
  readonly language: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly mode: NativeSourceProjectionMode;
  readonly sourceText: string;
  readonly outputHash: string;
  readonly declarations: readonly NativeSourceProjectionDeclaration[];
  readonly losses: readonly NativeAstLossRecord[];
  readonly lossSummary: NativeImportLossSummary;
  readonly readiness: NativeImportReadinessClassification;
  readonly evidence: readonly EvidenceRecord[];
  readonly metadata: Record<string, unknown>;
}

export type NativeSourceCompileOutputMode = NativeSourceProjectionMode | 'target-stubs' | 'target-adapter';

export interface CompileNativeSourceOptions extends ProjectNativeImportToSourceOptions {
  readonly target?: FrontierCompileTarget | string;
  readonly adapters?: readonly NativeImporterAdapter[];
  readonly targetAdapters?: readonly NativeTargetProjectionAdapter[];
  readonly targetAdapter?: NativeTargetProjectionAdapter | string;
  readonly targetAdapterResolver?: (
    input: NativeTargetProjectionAdapterResolverInput,
    adapters: readonly NativeTargetProjectionAdapter[]
  ) => NativeTargetProjectionAdapter | undefined;
  readonly targetAdapterOptions?: Record<string, unknown>;
  readonly targetAdapterMetadata?: Record<string, unknown>;
  readonly languages?: readonly NativeImportLanguageProfile[];
  readonly generatedAt?: number;
  readonly emitOnBlocked?: boolean;
  readonly emitSourceMap?: boolean;
  readonly targetPath?: string;
  readonly targetHash?: string;
  readonly sourceMapId?: string;
  readonly projectionId?: string;
  readonly projectionEvidenceId?: string;
  readonly compileEvidenceId?: string;
  readonly evidence?: readonly EvidenceRecord[];
  readonly losses?: readonly NativeAstLossRecord[];
}

export interface NativeSourceCompileResult {
  readonly kind: 'frontier.lang.nativeSourceCompileResult';
  readonly version: 1;
  readonly id: string;
  readonly ok: boolean;
  readonly target: FrontierCompileTarget | string;
  readonly language: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly output: string;
  readonly outputHash: string;
  readonly outputMode: NativeSourceCompileOutputMode;
  readonly sourceMap?: SourceMapRecord;
  readonly sourceMaps: readonly SourceMapRecord[];
  readonly importResult: NativeSourceImportResult;
  readonly projection: NativeSourceProjectionResult;
  readonly targetProjection?: NativeTargetProjectionResult;
  readonly targetCoverage: ProjectionTargetCoverageEntry;
  readonly projectionMatrix: ProjectionTargetLossMatrix;
  readonly losses: readonly NativeAstLossRecord[];
  readonly lossSummary: NativeImportLossSummary;
  readonly readiness: NativeImportReadinessClassification;
  readonly evidence: readonly EvidenceRecord[];
  readonly metadata: Record<string, unknown>;
}
